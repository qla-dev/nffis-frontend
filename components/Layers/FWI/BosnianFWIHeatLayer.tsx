import React, { useCallback, useMemo } from 'react';
import * as plotty from 'plotty';
import { FWIGeoTiffLayer } from './FWIGeoTiffLayer';
import {
  BH_FWI_COLOR_SCALE_NAME,
  BH_FWI_COLOR_STOPS,
  BH_FWI_RASTER_BOUNDS,
} from '../../../lib/fwi/bhFwiColorScale';
import {
  applySpreadWarningsToFwi,
  assessFireSpreadWarning,
} from '../../../lib/fwi/fireSpreadWarning';
import type { FireEventProperties } from '../../../services/fireMonitoringService';
import { EFFIS_FWI_DISPLAY_MAX } from '../../../lib/fwi/effisFwiScale';

plotty.addColorScale(
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
  activeFires?: FireEventProperties[];
  fireSpreadVisible?: boolean;
}

export const BosnianFWIHeatLayer: React.FC<BosnianFWIHeatLayerProps> = ({
  points,
  rasterBounds,
  pane,
  visible,
  rasterMask,
  activeFires = [],
  fireSpreadVisible = false,
}) => {
  const getFwiValue = useCallback(
    (point: BosnianFWIHeatLayerProps['points'][number]) => point.fwiBosnian,
    []
  );
  const spreadWarnings = useMemo(
    () => fireSpreadVisible ? activeFires.flatMap((event) => {
      if (!event.is_active) return [];
      // Test FWI is injected only at the synthetic fire for the composite
      // surface; it is intentionally not added to the nationwide base raster.
      const calculationPoints = event.external_id === 'SYNTHETIC-FWI-TEST'
        ? [...points, { id: 'synthetic-fwi-maximum', lat: event.latitude, lng: event.longitude, fwiBosnian: 80 }]
        : points;
      const warning = assessFireSpreadWarning(event, calculationPoints);
      return warning ? [warning] : [];
    }) : [],
    [activeFires, fireSpreadVisible, points],
  );
  const applySpreadToCell = useCallback(
    (value: number, lat: number, lng: number) => applySpreadWarningsToFwi(value, lat, lng, spreadWarnings),
    [spreadWarnings],
  );

  return (
    <FWIGeoTiffLayer
      points={points}
      visible={visible}
      valueAccessor={getFwiValue}
      cellValueTransform={fireSpreadVisible ? applySpreadToCell : undefined}
      displayMin={0}
      displayMax={EFFIS_FWI_DISPLAY_MAX}
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
