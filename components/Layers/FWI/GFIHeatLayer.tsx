import React, { useCallback } from 'react';
import { FWIGeoTiffLayer } from './FWIGeoTiffLayer';

interface GFIHeatLayerProps {
  points: Array<{
    id: string;
    lat: number;
    lng: number;
    gfi: number;
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

export const GFIHeatLayer: React.FC<GFIHeatLayerProps> = ({ points, rasterBounds, pane, visible }) => {
  const getGfiValue = useCallback((point: GFIHeatLayerProps['points'][number]) => point.gfi, []);

  return (
    <FWIGeoTiffLayer
      points={points}
      visible={visible}
      valueAccessor={getGfiValue}
      displayMin={0}
      displayMax={10}
      rasterBounds={rasterBounds}
      colorScaleName="rainbow"
      debugLabel="GFI"
      opacity={0.72}
      influenceRadius={0.95}
      pane={pane}
    />
  );
};
