import L from 'leaflet';
import { fromArrayBuffer } from 'geotiff';
import * as plotty from 'plotty';

export interface RasterBounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

interface RasterOverlayOptions {
  colorScale: string;
  displayMin: number;
  displayMax: number;
  opacity: number;
  pane?: string;
  bounds?: RasterBounds;
  boundaryMask?: GeoJSON.FeatureCollection;
  smooth?: boolean;
}

export interface RasterOverlayResult {
  layer: L.ImageOverlay;
  release: () => void;
}

function webMercatorToLongitude(x: number): number {
  return x * 180 / 20037508.34;
}

function webMercatorToLatitude(y: number): number {
  return 180 / Math.PI * (2 * Math.atan(Math.exp(y / 6378137)) - Math.PI / 2);
}

function geographicBounds(image: Awaited<ReturnType<Awaited<ReturnType<typeof fromArrayBuffer>>['getImage']>>): RasterBounds {
  const [west, south, east, north] = image.getBoundingBox();
  const keys = image.getGeoKeys() || {};
  const projectedCode = Number(keys.ProjectedCSTypeGeoKey || 0);
  const geographicCode = Number(keys.GeographicTypeGeoKey || 0);

  if (projectedCode === 3857 || projectedCode === 900913) {
    return {
      west: webMercatorToLongitude(west),
      south: webMercatorToLatitude(south),
      east: webMercatorToLongitude(east),
      north: webMercatorToLatitude(north),
    };
  }
  if (!projectedCode || geographicCode === 4326) return { west, south, east, north };

  throw new Error(`Unsupported GeoTIFF projection EPSG:${projectedCode}. Reproject the raster to EPSG:4326 or EPSG:3857.`);
}

function applyBoundaryMask(canvas: HTMLCanvasElement, bounds: RasterBounds, boundary: GeoJSON.FeatureCollection): void {
  const mask = document.createElement('canvas');
  mask.width = canvas.width;
  mask.height = canvas.height;
  const context = mask.getContext('2d');
  const target = canvas.getContext('2d');
  if (!context || !target) return;

  const point = ([longitude, latitude]: GeoJSON.Position): [number, number] => [
    (longitude - bounds.west) / (bounds.east - bounds.west) * canvas.width,
    (bounds.north - latitude) / (bounds.north - bounds.south) * canvas.height,
  ];

  for (const feature of boundary.features) {
    const geometry = feature.geometry;
    if (!geometry || (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon')) continue;
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    for (const polygon of polygons) {
      context.beginPath();
      for (const ring of polygon) {
        ring.forEach((coordinate, index) => {
          const [x, y] = point(coordinate);
          if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
        });
        context.closePath();
      }
      context.fillStyle = '#fff';
      context.fill('evenodd');
    }
  }

  target.save();
  target.globalCompositeOperation = 'destination-in';
  target.drawImage(mask, 0, 0);
  target.restore();
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(
    blob => blob ? resolve(blob) : reject(new Error('Unable to encode rendered raster.')),
    'image/png',
  ));
}

/** Render a single-band GeoTIFF as a standard Leaflet image overlay. */
export async function createLeafletRasterOverlay(
  buffer: ArrayBuffer,
  options: RasterOverlayOptions,
): Promise<RasterOverlayResult> {
  const tiff = await fromArrayBuffer(buffer);
  const image = await tiff.getImage();
  const rasters = await image.readRasters({ samples: [0] });
  const values = rasters[0];
  const bounds = options.bounds ?? geographicBounds(image);
  const canvas = document.createElement('canvas');
  canvas.width = image.getWidth();
  canvas.height = image.getHeight();

  const renderer = new plotty.plot({
    canvas,
    data: values,
    width: canvas.width,
    height: canvas.height,
    domain: [options.displayMin, options.displayMax],
    colorScale: options.colorScale,
    clampLow: true,
    clampHigh: true,
    noDataValue: image.getGDALNoData(),
    useWebGL: false,
  });
  renderer.render();
  if (options.boundaryMask) applyBoundaryMask(canvas, bounds, options.boundaryMask);

  const objectUrl = URL.createObjectURL(await canvasBlob(canvas));
  const layer = L.imageOverlay(objectUrl, [[bounds.south, bounds.west], [bounds.north, bounds.east]], {
    opacity: options.opacity,
    pane: options.pane,
    interactive: false,
    className: options.smooth ? 'nffis-raster-smooth' : 'nffis-raster-crisp',
  });

  return { layer, release: () => URL.revokeObjectURL(objectUrl) };
}
