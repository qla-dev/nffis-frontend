import React, { useCallback, useMemo } from 'react';
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

  const fwiColorScale = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 256, 0);
      gradient.addColorStop(0, '#22c55e');   // Green
      gradient.addColorStop(0.5, '#f97316'); // Orange
      gradient.addColorStop(1, '#ef4444');   // Red
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 1);
    }
    return canvas;
  }, []);

  return (
    <FWIGeoTiffLayer
      points={points}
      visible={visible}
      valueAccessor={getFwiValue}
      displayMin={0}
      displayMax={80}
      colorScaleImage={fwiColorScale}
      rasterBounds={rasterBounds}
      debugLabel="BosnianFWI"
      opacity={0.55}
      influenceRadius={0.65}
      pane={pane}
    />
  );
};
