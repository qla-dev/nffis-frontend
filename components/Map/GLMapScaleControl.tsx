import React, { useEffect, useState } from 'react';
import type { Map } from 'maplibre-gl';
import { MAX_BAR_WIDTH, ScaleBar, scaleReading, type ScaleReading } from './ScaleBar';

function groundDistanceMeters(map: Map): number {
  const container = map.getContainer();
  const middleX = container.clientWidth / 2;
  const middleY = container.clientHeight / 2;
  const left = map.unproject([middleX - MAX_BAR_WIDTH / 2, middleY]);
  const right = map.unproject([middleX + MAX_BAR_WIDTH / 2, middleY]);
  const radians = Math.PI / 180;
  const latitudeDelta = (right.lat - left.lat) * radians;
  const longitudeDelta = (right.lng - left.lng) * radians;
  const arc = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(left.lat * radians) * Math.cos(right.lat * radians) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(Math.min(1, arc)));
}

export function GLMapScaleControl({ map }: { map: Map | null }) {
  const [scale, setScale] = useState<ScaleReading | null>(null);

  useEffect(() => {
    if (!map) {
      setScale(null);
      return;
    }

    const sync = () => setScale(scaleReading(groundDistanceMeters(map)));
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

  return scale ? <ScaleBar scale={scale} positionClassName="bottom-6 left-[4.5rem]" /> : null;
}
