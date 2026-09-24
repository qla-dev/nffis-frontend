import React from 'react';
import {
  Map,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { GLGISMapCore, type GLEngine } from './GLGISMapCore';
import type { GISMapProps } from './GISMap';

setWorkerUrl(workerUrl);

const engine: GLEngine = {
  createMap: (options) => new Map(options as ConstructorParameters<typeof Map>[0]),
  createNavigationControl: () => new NavigationControl({ showCompass: false }),
  createScaleControl: () => new ScaleControl({ maxWidth: 120, unit: 'metric' }),
};

export const MapLibreGISMap: React.FC<GISMapProps> = (props) => (
  <GLGISMapCore {...props} engine={engine} renderer="maplibre" />
);
