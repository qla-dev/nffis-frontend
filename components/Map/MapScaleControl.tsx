import React, { useEffect, useState } from 'react';
import { Ruler } from 'lucide-react';
import L from 'leaflet';

// Distances the bar is allowed to settle on, so the readout is always a round
// number the operator can reason about (100 m, 500 m, 1 km, 5 km, 10 km...).
const SCALE_STEPS = [
  10, 20, 50,
  100, 200, 500,
  1000, 2000, 5000,
  10000, 20000, 50000,
  100000, 200000, 500000,
];

const MAX_BAR_WIDTH = 132;

interface MapScaleControlProps {
  map: L.Map | null;
}

interface ScaleReading {
  meters: number;
  width: number;
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${meters / 1000} km` : `${meters} m`;
}

function readScale(map: L.Map): ScaleReading {
  const middleY = map.getSize().y / 2;

  // Ground distance covered by MAX_BAR_WIDTH pixels at the current view.
  const spanMeters = map.distance(
    map.containerPointToLatLng([0, middleY]),
    map.containerPointToLatLng([MAX_BAR_WIDTH, middleY])
  );

  if (!Number.isFinite(spanMeters) || spanMeters <= 0) {
    return { meters: SCALE_STEPS[0], width: MAX_BAR_WIDTH };
  }

  const meters = SCALE_STEPS.reduce(
    (chosen, step) => (step <= spanMeters ? step : chosen),
    SCALE_STEPS[0]
  );

  return {
    meters,
    width: Math.min(MAX_BAR_WIDTH, Math.round((meters / spanMeters) * MAX_BAR_WIDTH)),
  };
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

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[2000] hidden md:flex flex-col bg-slate-950/90 backdrop-blur-md border border-slate-800 px-4 py-3 rounded-xl shadow-2xl animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-6 mb-2">
        <div className="flex items-center gap-2">
          <Ruler size={13} className="text-blue-500" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scale</span>
        </div>
        <span className="text-[11px] font-black text-white font-mono tabular-nums">
          {formatDistance(scale.meters)}
        </span>
      </div>

      {/* Bar: end ticks plus the measured span, mirroring a printed map scale. */}
      <div className="relative h-3" style={{ width: MAX_BAR_WIDTH }}>
        <div className="absolute inset-x-0 top-1/2 h-px bg-slate-800" />
        <div
          className="absolute top-1/2 left-0 h-px bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: scale.width }}
        />
        <div className="absolute left-0 top-0 h-full w-px bg-blue-500" />
        <div
          className="absolute top-0 h-full w-px bg-blue-500 transition-all duration-300 ease-out"
          style={{ left: scale.width - 1 }}
        />
      </div>
    </div>
  );
};
