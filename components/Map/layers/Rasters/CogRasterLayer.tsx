import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import * as plotty from 'plotty';
import * as leafletGeoTiffPlotty from '@qartlabs/leaflet-geotiff/node_modules/plotty';
import '@qartlabs/leaflet-geotiff';
import '@qartlabs/leaflet-geotiff/leaflet-geotiff-plotty.js';
import { EFFIS_FWI_COLOR_STOPS, EFFIS_FWI_DISPLAY_MAX } from '../../../../lib/fwi/effisFwiScale';
import { smoothRasterTransform } from '../../../../lib/fwi/smoothRasterTransform';
import { ESA_WORLDCOVER_CLASSES } from '../../../../lib/gis/worldCoverLegend';
import { API_BASE_URL } from '../../../../services/api';

const EFFIS_SCALE = 'effis-fwi-cog-2021';
const WORLD_COVER_SCALE = 'esa-worldcover-2021';
const TERRAIN_SCALE = 'nffis-terrain';

function registerScale(name: string, colors: string[], positions: number[]) {
  plotty.addColorScale(name, colors, positions);
  leafletGeoTiffPlotty.addColorScale(name, colors, positions);
}

registerScale(EFFIS_SCALE, EFFIS_FWI_COLOR_STOPS.map(item => item.color), EFFIS_FWI_COLOR_STOPS.map(item => item.position));
registerScale(WORLD_COVER_SCALE,
  ESA_WORLDCOVER_CLASSES.map(item => item.color),
  [0, 10 / 90, 20 / 90, 30 / 90, 40 / 90, 50 / 90, 60 / 90, 70 / 90, 80 / 90, 85 / 90, 1]);
registerScale(TERRAIN_SCALE, ['#0f172a', '#166534', '#a3a36b', '#e2e8f0', '#ffffff'], [0, .18, .45, .75, 1]);

export interface CogRasterStyle {
  scale: 'fwi' | 'worldcover' | 'terrain';
  min: number;
  max: number;
  smooth?: boolean;
}

interface CogRasterLayerProps {
  url: string;
  pane: string;
  style: CogRasterStyle;
  opacity?: number;
  /** Polygons that retain raster pixels; everything outside is transparent. */
  boundaryMask?: GeoJSON.FeatureCollection;
  onLoadingChange?: (loading: boolean) => void;
}

export function CogRasterLayer({ url, pane, style, opacity = .78, boundaryMask, onLoadingChange }: CogRasterLayerProps) {
  const map = useMap();
  const layerRef = useRef<any>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cleanup = () => {
      if (layerRef.current) { layerRef.current.remove?.(); layerRef.current = null; }
      if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
    };
    cleanup(); onLoadingChange?.(true);
    // Dataset raster URLs are API routes. On nffis.com the API has a separate
    // origin, so a relative /api URL would otherwise request the static frontend
    // host and hand its HTML response to the GeoTIFF decoder.
    const rasterUrl = url.startsWith('/api/') ? `${API_BASE_URL}${url.slice('/api'.length)}` : url;
    fetch(rasterUrl, { credentials: 'include', headers: { Accept: 'image/tiff' } })
      .then(async response => {
        if (!response.ok) throw new Error(`COG request failed (${response.status})`);
        const buffer = await response.arrayBuffer();
        const header = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 4));
        const isTiff = header.length === 4 && (
          (header[0] === 0x49 && header[1] === 0x49 && (header[2] === 0x2a || header[2] === 0x2b) && header[3] === 0x00) ||
          (header[0] === 0x4d && header[1] === 0x4d && header[2] === 0x00 && (header[3] === 0x2a || header[3] === 0x2b))
        );
        if (!isTiff) {
          const contentType = response.headers.get('content-type') || 'unknown content type';
          throw new Error(`COG response is not a TIFF (${contentType}; ${buffer.byteLength} bytes).`);
        }
        return buffer;
      })
      .then(buffer => {
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(new Blob([buffer], { type: 'image/tiff' })); objectUrlRef.current = objectUrl;
        const leafletWithRaster = L as typeof L & { leafletGeotiff: (url: string, options: Record<string, unknown>) => any; LeafletGeotiff: { plotty: (options: Record<string, unknown>) => unknown } };
        const colorScale = style.scale === 'fwi' ? EFFIS_SCALE : style.scale === 'worldcover' ? WORLD_COVER_SCALE : TERRAIN_SCALE;
        const renderer = leafletWithRaster.LeafletGeotiff.plotty({ colorScale, displayMin: style.min, displayMax: style.max, clampLow: true, clampHigh: true });
        if (boundaryMask) maskRendererToBoundary(renderer as { render: (...args: any[]) => void }, map, boundaryMask);
        const layer = leafletWithRaster.leafletGeotiff(objectUrl, {
          pane, opacity, interactive: false,
          renderer,
        });
        if (style.smooth) layer.transform = smoothRasterTransform;
        layer.addTo(map); layerRef.current = layer; onLoadingChange?.(false);
      })
      .catch(error => { if (!cancelled) { console.error('Unable to render COG raster.', error); onLoadingChange?.(false); } });
    return () => { cancelled = true; cleanup(); onLoadingChange?.(false); };
  }, [boundaryMask, map, onLoadingChange, opacity, pane, style.max, style.min, style.scale, style.smooth, url]);

  return null;
}

/**
 * leaflet-geotiff can clip only one simple polygon. The reviewed national
 * boundary is a collection of municipal polygons, so create a canvas union of
 * those polygons and retain raster pixels only where that union is opaque.
 */
function maskRendererToBoundary(
  renderer: { render: (...args: any[]) => void },
  map: L.Map,
  boundary: GeoJSON.FeatureCollection,
): void {
  const render = renderer.render.bind(renderer);
  renderer.render = (raster: unknown, canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, args: unknown) => {
    render(raster, canvas, context, args);
    const mask = document.createElement('canvas');
    mask.width = canvas.width;
    mask.height = canvas.height;
    const maskContext = mask.getContext('2d');
    if (!maskContext) return;

    for (const feature of boundary.features) {
      const geometry = feature.geometry;
      if (!geometry || (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon')) continue;
      const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
      for (const polygon of polygons) {
        maskContext.beginPath();
        for (const ring of polygon) {
          ring.forEach(([longitude, latitude], index) => {
            const point = map.latLngToContainerPoint([latitude, longitude]);
            if (index === 0) maskContext.moveTo(point.x, point.y);
            else maskContext.lineTo(point.x, point.y);
          });
          maskContext.closePath();
        }
        // Fill each administrative polygon separately so neighbouring polygons
        // form a union instead of cancelling each other at shared boundaries.
        maskContext.fill('evenodd');
      }
    }

    context.save();
    context.globalCompositeOperation = 'destination-in';
    context.drawImage(mask, 0, 0);
    context.restore();
  };
}

export const FWI_COG_STYLE: CogRasterStyle = { scale: 'fwi', min: 0, max: EFFIS_FWI_DISPLAY_MAX, smooth: true };
