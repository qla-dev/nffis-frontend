import { useEffect } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { fetchDatasetLayerEditFeatures } from '../../../../services/datasetService';
import type { GeoEditorMode } from '../../../../lib/gis/geoEditor';

interface Props {
  layerId: number | null;
  mode: GeoEditorMode;
  onFeaturesLoaded: (layerId: number, features: GeoJSON.FeatureCollection) => void;
  onError: (message: string) => void;
}

function editingBbox(map: L.Map): string {
  const bounds = map.getBounds().pad(0.15);
  return [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()].join(',');
}

/** Loads full, unclipped PostGIS geometry once when an editing session starts. */
export function DatasetEditorDataLoader({ layerId, mode, onFeaturesLoaded, onError }: Props) {
  const map = useMap();

  useEffect(() => {
    if (layerId === null || mode === 'view') return;

    const controller = new AbortController();
    fetchDatasetLayerEditFeatures(layerId, {
      bbox: editingBbox(map),
      limit: 5000,
      signal: controller.signal,
    })
      .then((features) => {
        if (!controller.signal.aborted) onFeaturesLoaded(layerId, features);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error(`Failed to load editing geometry for dataset layer ${layerId}`, error);
        onError(error instanceof Error ? error.message : 'Unable to load editing geometry.');
      });

    return () => controller.abort();
  }, [layerId, map, mode, onError, onFeaturesLoaded]);

  return null;
}
