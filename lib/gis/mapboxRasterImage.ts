import { fromArrayBuffer } from 'geotiff';
import * as plotty from 'plotty';
import { EFFIS_FWI_COLOR_STOPS, EFFIS_FWI_DISPLAY_MAX } from '../fwi/effisFwiScale';
import { API_BASE_URL } from '../../services/api';

const SCALE = 'nffis-mapbox-fwi';
plotty.addColorScale(SCALE, EFFIS_FWI_COLOR_STOPS.map(stop => stop.color), EFFIS_FWI_COLOR_STOPS.map(stop => stop.position));

export interface MapboxRasterImage {
  url: string;
  coordinates: [[number, number], [number, number], [number, number], [number, number]];
  release: () => void;
}

function longitude(x: number) { return x * 180 / 20037508.34; }
function latitude(y: number) { return 180 / Math.PI * (2 * Math.atan(Math.exp(y / 6378137)) - Math.PI / 2); }

function blob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Unable to encode raster image.')), 'image/png'));
}

export async function renderFwiCogForMapbox(url: string, signal?: AbortSignal): Promise<MapboxRasterImage> {
  const resolved = url.startsWith('/api/') ? `${API_BASE_URL}${url.slice(4)}` : url;
  const response = await fetch(resolved, { credentials: 'include', headers: { Accept: 'image/tiff' }, signal });
  if (!response.ok) throw new Error(`FWI COG request failed (${response.status}).`);
  const tiff = await fromArrayBuffer(await response.arrayBuffer());
  const image = await tiff.getImage();
  const values = (await image.readRasters({ samples: [0] }))[0];
  let [west, south, east, north] = image.getBoundingBox();
  const keys = image.getGeoKeys() || {};
  const projection = Number(keys.ProjectedCSTypeGeoKey || 0);
  if (projection === 3857 || projection === 900913) {
    west = longitude(west); east = longitude(east);
    south = latitude(south); north = latitude(north);
  } else if (projection && Number(keys.GeographicTypeGeoKey || 0) !== 4326) {
    throw new Error(`Unsupported FWI GeoTIFF projection EPSG:${projection}.`);
  }
  const canvas = document.createElement('canvas');
  canvas.width = image.getWidth();
  canvas.height = image.getHeight();
  new plotty.plot({
    canvas, data: values, width: canvas.width, height: canvas.height,
    domain: [0, EFFIS_FWI_DISPLAY_MAX], colorScale: SCALE,
    clampLow: true, clampHigh: true, noDataValue: image.getGDALNoData(), useWebGL: false,
  }).render();
  const objectUrl = URL.createObjectURL(await blob(canvas));
  return {
    url: objectUrl,
    coordinates: [[west, north], [east, north], [east, south], [west, south]],
    release: () => URL.revokeObjectURL(objectUrl),
  };
}
