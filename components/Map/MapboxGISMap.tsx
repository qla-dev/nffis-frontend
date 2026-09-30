import React from 'react';
import * as mapboxgl from 'mapbox-gl/esm';
import 'mapbox-gl/dist/mapbox-gl.css';
import { GLGISMapCore, type GLEngine } from './GLGISMapCore';
import type { GISMapProps } from './GISMap';
import { hasUsableMapboxToken } from '../../lib/gis/mapRendererPoc';

const environment = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;
const accessToken = (environment.VITE_MAPBOX_ACCESS_TOKEN || '').trim();

const engine = {
  createMap: (options: Record<string, unknown>) => new mapboxgl.Map({ ...options, accessToken } as mapboxgl.MapOptions),
  createNavigationControl: () => new mapboxgl.NavigationControl({ showCompass: false }),
  createScaleControl: () => new mapboxgl.ScaleControl({ maxWidth: 120, unit: 'metric' }),
  createMarker: (element: HTMLElement) => new mapboxgl.Marker({ element, anchor: 'center' }),
  createPopup: () => new mapboxgl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '380px', className: 'nffis-operational-popup' }),
} as unknown as GLEngine;

export const MapboxGISMap: React.FC<GISMapProps> = (props) => (
  <GLGISMapCore
    {...props}
    engine={engine}
    renderer="mapbox"
    configurationError={hasUsableMapboxToken(accessToken) ? null : 'Mapbox requires VITE_MAPBOX_ACCESS_TOKEN with a valid public pk.* token.'}
  />
);
