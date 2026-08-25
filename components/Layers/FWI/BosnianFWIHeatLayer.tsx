import React, { useCallback } from 'react';
import * as plotty from 'plotty';
// leaflet-geotiff 1.1.2 installs its own Plotty 0.2 instance. Registering the
// scale only on the app's Plotty 0.4 instance leaves the renderer unaware of it.
import * as leafletGeoTiffPlotty from '@qartlabs/leaflet-geotiff/node_modules/plotty';
import { FWIGeoTiffLayer } from './FWIGeoTiffLayer';
import {
  BH_FWI_COLOR_SCALE_NAME,
  BH_FWI_COLOR_STOPS,
  BH_FWI_RASTER_BOUNDS,
} from '../../../lib/fwi/bhFwiColorScale';

plotty.addColorScale(
  BH_FWI_COLOR_SCALE_NAME,
  BH_FWI_COLOR_STOPS.map((stop) => stop.color),
  BH_FWI_COLOR_STOPS.map((stop) => stop.position),
);
leafletGeoTiffPlotty.addColorScale(
  BH_FWI_COLOR_SCALE_NAME,
  BH_FWI_COLOR_STOPS.map((stop) => stop.color),
  BH_FWI_COLOR_STOPS.map((stop) => stop.position),
);

interface BosnianFWIHeatLayerProps {
  points: Array<{
    id: string;
    lat: number;
    lng: number;
    fwiBosnian: number;
  }>;
  rasterBounds?: {
    west: number;
    east: number;
    south: number;
    north: number;
  };
  pane?: string;
  visible: boolean;
  rasterMask?: GeoJSON.FeatureCollection;
}

export const BosnianFWIHeatLayer: React.FC<BosnianFWIHeatLayerProps> = ({
  points,
  rasterBounds,
  pane,
  visible,
  rasterMask,
}) => {
  const getFwiValue = useCallback(
    (point: BosnianFWIHeatLayerProps['points'][number]) => point.fwiBosnian,
    []
  );

  return (
    <FWIGeoTiffLayer
      points={points}
      visible={visible}
      valueAccessor={getFwiValue}
      displayMin={0}
      displayMax={80}
      colorScaleName={BH_FWI_COLOR_SCALE_NAME}
      rasterBounds={rasterBounds ?? BH_FWI_RASTER_BOUNDS}
      rasterMask={rasterMask}
      debugLabel="BosnianFWI"
      opacity={0.72}
      influenceRadius={0.65}
      pane={pane}
    />
  );
};
