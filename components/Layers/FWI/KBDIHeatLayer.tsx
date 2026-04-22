import React, { useCallback } from 'react';
import { FWIGeoTiffLayer } from './FWIGeoTiffLayer';

interface KBDIHeatLayerProps {
  points: Array<{
    id: string;
    lat: number;
    lng: number;
    kbdi: number;
  }>;
  rasterBounds?: {
    west: number;
    east: number;
    south: number;
    north: number;
  };
  visible: boolean;
}

export const KBDIHeatLayer: React.FC<KBDIHeatLayerProps> = ({
  points,
  rasterBounds,
  visible,
}) => {
  const getKbdiValue = useCallback(
    (point: KBDIHeatLayerProps['points'][number]) => point.kbdi,
    []
  );

  return (
    <FWIGeoTiffLayer
      points={points}
      visible={visible}
      valueAccessor={getKbdiValue}
      displayMin={0}
      displayMax={650}
      rasterBounds={rasterBounds}
      colorScaleName="rainbow"
      debugLabel="KBDI"
      opacity={0.72}
      influenceRadius={1.05}
    />
  );
};
