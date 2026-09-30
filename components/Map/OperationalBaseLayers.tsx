import { TileLayer, WMSTileLayer } from 'react-leaflet';
import L from 'leaflet';
import { MapLayer } from '../../types';
import { EXTERNAL_BASE_LAYERS, NASA_FIRMS_LAYER, NASA_GIBS_WMS_URL, NASA_LAND_SURFACE_TEMPERATURE_LAYER, OPENSTREETMAP_BASE_LAYER, usesPlainBaseLayer } from '../../lib/gis/externalMapLayers';

export function OperationalBaseLayers({ activeBaseLayerId, activeLayers, meteoblueUrl, meteoblueAvailable, gibsDate, onMeteoblueTileError }: { activeBaseLayerId?: MapLayer; activeLayers: Set<MapLayer>; meteoblueUrl?: string | null; meteoblueAvailable: boolean; gibsDate: string; onMeteoblueTileError: () => void }) {
  const active = activeBaseLayerId ? EXTERNAL_BASE_LAYERS[activeBaseLayerId] : undefined;
  const sentinel = activeBaseLayerId === MapLayer.SENTINEL;
  const meteoblue = activeBaseLayerId === MapLayer.WINDY && meteoblueAvailable;
  const plain = usesPlainBaseLayer(activeBaseLayerId);
  return <>
    {!meteoblue && !plain && sentinel && <TileLayer key="sentinel-loading-fallback" {...OPENSTREETMAP_BASE_LAYER} updateWhenIdle updateWhenZooming={false} keepBuffer={1} />}
    {!meteoblue && !plain && <TileLayer key={activeBaseLayerId ?? 'default'} url={active?.url ?? OPENSTREETMAP_BASE_LAYER.url} attribution={active?.attribution ?? OPENSTREETMAP_BASE_LAYER.attribution} className={active?.className ?? OPENSTREETMAP_BASE_LAYER.className} maxNativeZoom={active?.maxNativeZoom ?? OPENSTREETMAP_BASE_LAYER.maxNativeZoom} maxZoom={active?.maxZoom ?? OPENSTREETMAP_BASE_LAYER.maxZoom} updateWhenIdle={sentinel} updateWhenZooming={!sentinel} keepBuffer={sentinel ? 1 : 2} />}
    {meteoblue && meteoblueUrl && <TileLayer key={`meteoblue-${meteoblueUrl}`} url={meteoblueUrl} attribution="Meteoblue" opacity={0.78} pane="meteoblue-overlay-pane" zIndex={380} keepBuffer={0} updateWhenIdle updateWhenZooming={false} eventHandlers={{ tileerror: onMeteoblueTileError }} />}
    {activeLayers.has(MapLayer.NASA_FIRMS) && <WMSTileLayer key={`nasa-firms-${gibsDate}`} url={NASA_GIBS_WMS_URL} params={{ layers: NASA_FIRMS_LAYER, styles: 'default', format: 'image/png', transparent: true, version: '1.3.0', time: gibsDate } as L.WMSParams} attribution={`NASA EOSDIS GIBS / FIRMS (${gibsDate})`} opacity={0.95} />}
    {activeLayers.has(MapLayer.THERMAL) && <WMSTileLayer key={`nasa-lst-${gibsDate}`} url={NASA_GIBS_WMS_URL} params={{ layers: NASA_LAND_SURFACE_TEMPERATURE_LAYER, styles: 'default', format: 'image/png', transparent: true, version: '1.3.0', time: gibsDate } as L.WMSParams} attribution={`NASA EOSDIS GIBS — Terra/MODIS land-surface temperature (${gibsDate})`} opacity={0.72} />}
  </>;
}
