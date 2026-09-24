import { useCallback } from 'react';
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
  const isWorldCover = isEsaWorldCoverLayer(layer.table_name, layer.display_name);
  const style: CogRasterStyle = isWorldCover
    ? { scale: 'worldcover', min: 10, max: 100 }
    : { scale: 'terrain', min: Number(layer.style?.min ?? 0), max: Number(layer.style?.max ?? 2200), smooth: true };
  const handleLoadingChange = useCallback((loading: boolean) => onLoadingChange?.(layer.id, loading), [layer.id, onLoadingChange]);
  return <CogRasterLayer url={`/api/dataset-layers/${layer.id}/raster`} pane={pane} style={style} opacity={layer.style?.opacity ?? .78} boundaryMask={isWorldCover ? boundaryMask : undefined} onLoadingChange={handleLoadingChange} />;
}
