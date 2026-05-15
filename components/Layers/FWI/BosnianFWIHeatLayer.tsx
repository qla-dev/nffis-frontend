import React, { useCallback } from 'react';
import { FWIGeoTiffLayer } from './FWIGeoTiffLayer';

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
}

export const BosnianFWIHeatLayer: React.FC<BosnianFWIHeatLayerProps> = ({
  points,
  rasterBounds,
  pane,
  visible,
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
      rasterBounds={rasterBounds}
      colorScaleName="jet"
      debugLabel="BosnianFWI"
      opacity={0.78}
      influenceRadius={0.65}
      pane={pane}
    />
  );
};
