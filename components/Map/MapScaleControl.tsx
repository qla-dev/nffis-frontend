import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import { MAX_BAR_WIDTH, ScaleBar, scaleReading, type ScaleReading } from './ScaleBar';

interface MapScaleControlProps {
  map: L.Map | null;
}

function readScale(map: L.Map): ScaleReading {
  const middleY = map.getSize().y / 2;

  // Ground distance covered by MAX_BAR_WIDTH pixels at the current view.
  const spanMeters = map.distance(
    map.containerPointToLatLng([0, middleY]),
    map.containerPointToLatLng([MAX_BAR_WIDTH, middleY])
  );

  return scaleReading(spanMeters);
}

export const MapScaleControl: React.FC<MapScaleControlProps> = ({ map }) => {
  const [scale, setScale] = useState<ScaleReading | null>(null);

  useEffect(() => {
    if (!map) {
      setScale(null);
      return;
    }

    const sync = () => setScale(readScale(map));

    sync();
    map.on('zoomend', sync);
    map.on('moveend', sync);
    map.on('resize', sync);

    return () => {
      map.off('zoomend', sync);
      map.off('moveend', sync);
      map.off('resize', sync);
    };
  }, [map]);

  if (!scale) {
    return null;
  }

  return <ScaleBar scale={scale} positionClassName="bottom-8 left-1/2 -translate-x-1/2" />;
};
