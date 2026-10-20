import React, { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { CircleMarker, GeoJSON, MapContainer, Polygon, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { MultiPolygon } from '../../services/pdrService';

const BIH_BOUNDS: L.LatLngBoundsExpression = [[42.55, 15.72], [45.28, 19.62]];

interface PerimeterMapProps {
  geometry?: MultiPolygon | null;
  /** Vertices being drawn, as [lng, lat]. */
  drawing?: [number, number][];
  onAddVertex?: (vertex: [number, number]) => void;
  height?: number;
  label?: string;
}

/** Small application map: shows a burnt perimeter and supports click-to-draw (FC_PDR01 step 2, FC_PDR03). */
export function PerimeterMap({ geometry, drawing, onAddVertex, height = 380, label }: PerimeterMapProps) {
  const feature = useMemo(() => geometry ? ({ type: 'Feature', properties: {}, geometry }) as GeoJSON.Feature : null, [geometry]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-500/30" style={{ height }} aria-label={label} data-testid="pdr-map">
      <MapContainer bounds={BIH_BOUNDS} className="h-full w-full" scrollWheelZoom style={{ cursor: onAddVertex ? 'crosshair' : undefined }}>
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" maxZoom={19} />
        {feature && <GeoJSON key={JSON.stringify(geometry).length + ':' + JSON.stringify(geometry).slice(0, 64)} data={feature} style={{ color: '#dc2626', weight: 2, fillColor: '#f97316', fillOpacity: 0.35 }} />}
        {drawing && drawing.length > 0 && (
          <>
            {drawing.length >= 3
              ? <Polygon positions={drawing.map(([lng, lat]) => [lat, lng])} pathOptions={{ color: '#2563eb', weight: 2, dashArray: '6 4', fillOpacity: 0.15 }} />
              : <Polyline positions={drawing.map(([lng, lat]) => [lat, lng])} pathOptions={{ color: '#2563eb', weight: 2, dashArray: '6 4' }} />}
            {drawing.map(([lng, lat], index) => <CircleMarker key={`${lng}-${lat}-${index}`} center={[lat, lng]} radius={4} pathOptions={{ color: '#1d4ed8', fillColor: '#fff', fillOpacity: 1, weight: 2 }} />)}
          </>
        )}
        <FitToGeometry geometry={geometry} />
        {onAddVertex && <ClickToDraw onAddVertex={onAddVertex} />}
      </MapContainer>
    </div>
  );
}

function FitToGeometry({ geometry }: { geometry?: MultiPolygon | null }) {
  const map = useMap();
  useEffect(() => {
    if (!geometry) return;
    const bounds = L.geoJSON(geometry as GeoJSON.GeoJsonObject).getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
  }, [geometry, map]);
  return null;
}

function ClickToDraw({ onAddVertex }: { onAddVertex: (vertex: [number, number]) => void }) {
  useMapEvents({ click: (event) => onAddVertex([Number(event.latlng.lng.toFixed(6)), Number(event.latlng.lat.toFixed(6))]) });
  return null;
}

export function drawingToGeometry(points: [number, number][]): MultiPolygon | null {
  if (points.length < 3) return null;
  return { type: 'MultiPolygon', coordinates: [[[...points, points[0]]]] };
}
