import { TileLayer } from 'react-leaflet';
import type { DatasetLayer } from '../../../../services/datasetService';

interface DatasetRasterLayerProps {
  layer: DatasetLayer;
  pane: string;
  onLoadingChange?: (layerId: number, isLoading: boolean) => void;
}

export function DatasetRasterLayer({ layer, pane, onLoadingChange }: DatasetRasterLayerProps) {
  return (
    <TileLayer
      url={`/api/dataset-layers/${layer.id}/raster-tiles/{z}/{x}/{y}.png`}
      pane={pane}
      minZoom={layer.min_zoom ?? 0}
      maxNativeZoom={22}
      opacity={layer.style?.opacity ?? 0.9}
      eventHandlers={{
        loading: () => onLoadingChange?.(layer.id, true),
        load: () => onLoadingChange?.(layer.id, false),
        tileerror: () => onLoadingChange?.(layer.id, false),
      }}
    />
  );
}
