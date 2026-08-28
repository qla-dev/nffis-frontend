import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-velocity/dist/leaflet-velocity.css';
import { WIND_REFRESH_MS, fetchWindGrid, type VelocityRecord } from '../../../../services/windService';

interface LiveWindVectorLayerProps {
  visible: boolean;
  mask?: GeoJSON.FeatureCollection;
}

// leaflet-velocity's dist bundle reads a global `L` at evaluation time and Leaflet's
// ESM build does not publish one, so the plugin has to be pulled in after we expose it.
let pluginPromise: Promise<void> | null = null;

function loadVelocityPlugin(): Promise<void> {
  if (!pluginPromise) {
    (window as unknown as { L: typeof L }).L = L;
    pluginPromise = import('leaflet-velocity').then(() => {
      guardCanvasLayerTeardown();
    });
  }

  return pluginPromise;
}

// leaflet-velocity's CanvasLayer keeps a queued animation frame alive after the layer
// is pulled off the map, and that frame dereferences `this._map`. Toggling the wind
// overlay off therefore throws "Cannot read properties of null (reading 'getSize')".
// Bail out of a draw whose layer is already detached.
function guardCanvasLayerTeardown(): void {
  const canvasLayer = (L as unknown as { CanvasLayer?: { prototype: Record<string, unknown> } }).CanvasLayer;
  const proto = canvasLayer?.prototype;

  if (!proto || proto.__nffisTeardownGuard) {
    return;
  }

  const originalDrawLayer = proto.drawLayer as (...args: unknown[]) => unknown;

  proto.drawLayer = function patchedDrawLayer(this: { _map?: unknown; _canvas?: unknown }, ...args: unknown[]) {
    if (!this._map || !this._canvas) {
      return undefined;
    }

    return originalDrawLayer.apply(this, args);
  };

  proto.__nffisTeardownGuard = true;
}

// Cool -> hot ramp, matching the palette used by the rest of the NFFIS overlays.
const WIND_COLOR_SCALE = [
  'rgb(56,189,248)',
  'rgb(45,212,191)',
  'rgb(163,230,53)',
  'rgb(250,204,21)',
  'rgb(249,115,22)',
  'rgb(239,68,68)',
];

export const LiveWindVectorLayer: React.FC<LiveWindVectorLayerProps> = ({ visible, mask }) => {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);
  const [data, setData] = useState<VelocityRecord[] | null>(null);

  // Fetch on activation, then keep refreshing while the layer stays on.
  useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const load = () => {
      fetchWindGrid(mask, controller.signal)
        .then((grid) => {
          if (!cancelled) setData(grid);
        })
        .catch((error) => {
          if (!cancelled && error?.name !== 'AbortError') {
            console.error('Live wind vector: unable to load wind grid', error);
          }
        });
    };

    load();
    const intervalId = window.setInterval(load, WIND_REFRESH_MS);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [mask, visible]);

  // Create / update / tear down the velocity layer.
  useEffect(() => {
    let disposed = false;

    if (!visible || !data) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    loadVelocityPlugin().then(() => {
      if (disposed || !visible) return;

      const velocity = (L as unknown as { velocityLayer?: (options: unknown) => L.Layer }).velocityLayer;

      if (typeof velocity !== 'function') {
        console.error('Live wind vector: leaflet-velocity failed to register');
        return;
      }

      if (layerRef.current) {
        (layerRef.current as unknown as { setData: (d: VelocityRecord[]) => void }).setData(data);
        return;
      }

      const layer = velocity({
        // The plugin's own readout is disabled: every map corner already carries an
        // NFFIS panel (status, controls, legends, FWI scale), so it lands clipped.
        // Speed is conveyed by the particle colour ramp instead.
        displayValues: false,
        data,
        minVelocity: 0,
        maxVelocity: 15,
        velocityScale: 0.012,
        particleAge: 70,
        particleMultiplier: 1 / 220,
        lineWidth: 1.4,
        frameRate: 20,
        colorScale: WIND_COLOR_SCALE,
      });

      layer.addTo(map);
      layerRef.current = layer;
    });

    return () => {
      disposed = true;
    };
  }, [data, map, visible]);

  // Drop the layer when the map itself goes away.
  useEffect(() => {
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map]);

  return null;
};
