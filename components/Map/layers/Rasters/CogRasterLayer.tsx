import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import * as plotty from 'plotty';
import { EFFIS_FWI_COLOR_STOPS, EFFIS_FWI_DISPLAY_MAX } from '../../../../lib/fwi/effisFwiScale';
import { ESA_WORLDCOVER_CLASSES } from '../../../../lib/gis/worldCoverLegend';
import { createLeafletRasterOverlay } from '../../../../lib/gis/leafletRasterOverlay';
import { API_BASE_URL } from '../../../../services/api';

const EFFIS_SCALE = 'effis-fwi-cog-2021';
const WORLD_COVER_SCALE = 'esa-worldcover-2021';
const TERRAIN_SCALE = 'nffis-terrain';
const RASTER_BUFFER_CACHE_LIMIT = 8;
const rasterBufferCache = new Map<string, Promise<ArrayBuffer>>();

function registerScale(name: string, colors: string[], positions: number[]) {
  plotty.addColorScale(name, colors, positions);
}

registerScale(EFFIS_SCALE, EFFIS_FWI_COLOR_STOPS.map(item => item.color), EFFIS_FWI_COLOR_STOPS.map(item => item.position));
registerScale(WORLD_COVER_SCALE,
  ESA_WORLDCOVER_CLASSES.map(item => item.color),
  [0, 10 / 90, 20 / 90, 30 / 90, 40 / 90, 50 / 90, 60 / 90, 70 / 90, 80 / 90, 85 / 90, 1]);
registerScale(TERRAIN_SCALE, ['#0f172a', '#166534', '#a3a36b', '#e2e8f0', '#ffffff'], [0, .18, .45, .75, 1]);

function resolveRasterUrl(url: string) {
  return url.startsWith('/api/') ? `${API_BASE_URL}${url.slice('/api'.length)}` : url;
}

function fetchRasterBuffer(url: string): Promise<ArrayBuffer> {
  const rasterUrl = resolveRasterUrl(url);
  const cached = rasterBufferCache.get(rasterUrl);
  if (cached) {
    rasterBufferCache.delete(rasterUrl);
    rasterBufferCache.set(rasterUrl, cached);
    return cached;
  }

  const request = fetch(rasterUrl, { credentials: 'include', headers: { Accept: 'image/tiff' } })
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
    .catch(error => {
      rasterBufferCache.delete(rasterUrl);
      throw error;
    });

  rasterBufferCache.set(rasterUrl, request);
  while (rasterBufferCache.size > RASTER_BUFFER_CACHE_LIMIT) {
    const oldest = rasterBufferCache.keys().next().value as string | undefined;
    if (!oldest) break;
    rasterBufferCache.delete(oldest);
  }
  return request;
}

export function preloadCogRaster(url: string) {
  void fetchRasterBuffer(url).catch(() => undefined);
}

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
  const releaseRef = useRef<(() => void) | null>(null);
  const requestVersionRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const requestVersion = ++requestVersionRef.current;
    onLoadingChange?.(true);
    fetchRasterBuffer(url)
      .then(async buffer => {
        if (cancelled || requestVersion !== requestVersionRef.current) return;
        const colorScale = style.scale === 'fwi' ? EFFIS_SCALE : style.scale === 'worldcover' ? WORLD_COVER_SCALE : TERRAIN_SCALE;
        const rendered = await createLeafletRasterOverlay(buffer, {
          colorScale, displayMin: style.min, displayMax: style.max, pane, opacity,
          boundaryMask, smooth: style.smooth,
        });
        if (cancelled || requestVersion !== requestVersionRef.current) { rendered.release(); return; }
        const previousLayer = layerRef.current;
        const previousRelease = releaseRef.current;
        rendered.layer.addTo(map);
        layerRef.current = rendered.layer;
        releaseRef.current = rendered.release;
        previousLayer?.remove?.();
        previousRelease?.();
        onLoadingChange?.(false);
      })
      .catch(error => { if (!cancelled && requestVersion === requestVersionRef.current) { console.error('Unable to render COG raster.', error); onLoadingChange?.(false); } });
    return () => { cancelled = true; };
  }, [boundaryMask, map, onLoadingChange, opacity, pane, style.max, style.min, style.scale, style.smooth, url]);

  useEffect(() => () => {
    requestVersionRef.current += 1;
    layerRef.current?.remove?.();
    layerRef.current = null;
    releaseRef.current?.();
    releaseRef.current = null;
    onLoadingChange?.(false);
  }, [onLoadingChange]);

  return null;
}

export const FWI_COG_STYLE: CogRasterStyle = { scale: 'fwi', min: 0, max: EFFIS_FWI_DISPLAY_MAX, smooth: true };
