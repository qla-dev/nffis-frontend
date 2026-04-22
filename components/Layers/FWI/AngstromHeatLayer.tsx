import React, { useCallback } from 'react';
import { FWIGeoTiffLayer } from './FWIGeoTiffLayer';

interface AngstromHeatLayerProps {
  points: Array<{
    id: string;
    lat: number;
    lng: number;
    angstrom: number;
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

export const AngstromHeatLayer: React.FC<AngstromHeatLayerProps> = ({
  points,
  rasterBounds,
  pane,
  visible,
}) => {
  const getAngstromSeverity = useCallback(
    (point: AngstromHeatLayerProps['points'][number]) => Math.max(0, 6 - point.angstrom),
    []
  );

  return (
    <FWIGeoTiffLayer
      points={points}
      visible={visible}
      valueAccessor={getAngstromSeverity}
      displayMin={0}
      displayMax={5}
      rasterBounds={rasterBounds}
      colorScaleName="inferno"
      debugLabel="Angstrom"
      opacity={0.74}
      influenceRadius={0.9}
      pane={pane}
    />
  );
};
