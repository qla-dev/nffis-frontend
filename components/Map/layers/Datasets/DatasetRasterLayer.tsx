import { useCallback, useEffect, useMemo, useRef } from 'react';
import { TileLayer } from 'react-leaflet';
import type { DatasetLayer } from '../../../../services/datasetService';
import { isEsaWorldCoverLayer } from '../../../../lib/gis/worldCoverLegend';
import { CogRasterLayer, type CogRasterStyle } from '../Rasters/CogRasterLayer';

interface DatasetRasterLayerProps {
  layer: DatasetLayer;
  pane: string;
  boundaryMask?: GeoJSON.FeatureCollection;
  onLoadingChange?: (layerId: number, isLoading: boolean) => void;
}

export function DatasetRasterLayer({ layer, pane, boundaryMask, onLoadingChange }: DatasetRasterLayerProps) {
  const loadingTimeoutRef = useRef<number | null>(null);
  const isWorldCover = isEsaWorldCoverLayer(layer.table_name, layer.display_name);
  const vegetationScale = layer.style?.raster_scale;
  const style: CogRasterStyle = vegetationScale
    ? { scale: vegetationScale, min: Number(layer.style.min), max: Number(layer.style.max), smooth: true }
    : isWorldCover
    ? { scale: 'worldcover', min: 10, max: 100 }
    : { scale: 'terrain', min: Number(layer.style?.min ?? 0), max: Number(layer.style?.max ?? 2200), smooth: true };
  const handleLoadingChange = useCallback((loading: boolean) => {
    if (loadingTimeoutRef.current !== null) window.clearTimeout(loadingTimeoutRef.current);
    loadingTimeoutRef.current = loading
      ? window.setTimeout(() => onLoadingChange?.(layer.id, false), 20_000)
      : null;
    onLoadingChange?.(layer.id, loading);
  }, [layer.id, onLoadingChange]);
  const tileEvents = useMemo(() => ({
    loading: () => handleLoadingChange(true),
    load: () => handleLoadingChange(false),
    tileerror: () => handleLoadingChange(false),
  }), [handleLoadingChange]);
  useEffect(() => () => {
    if (loadingTimeoutRef.current !== null) window.clearTimeout(loadingTimeoutRef.current);
    onLoadingChange?.(layer.id, false);
  }, [layer.id, onLoadingChange]);
  if (vegetationScale) {
    return <TileLayer
      url={`/api/dataset-layers/${layer.id}/raster-tiles/{z}/{x}/{y}.png?v=${encodeURIComponent(layer.tile_version || '1')}`}
      pane={pane}
      opacity={layer.style?.opacity ?? .82}
      eventHandlers={tileEvents}
      minZoom={layer.min_zoom ?? 0}
      maxZoom={22}
      maxNativeZoom={14}
    />;
  }
  return <CogRasterLayer url={`/api/dataset-layers/${layer.id}/raster`} pane={pane} style={style} opacity={layer.style?.opacity ?? .78} boundaryMask={isWorldCover ? boundaryMask : undefined} onLoadingChange={handleLoadingChange} />;
}
