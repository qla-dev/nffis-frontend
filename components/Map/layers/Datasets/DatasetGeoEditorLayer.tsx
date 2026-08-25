import React, { Fragment, useMemo, useState } from 'react';
import L from 'leaflet';
import { CircleMarker, GeoJSON, LayerGroup, Marker, Polygon, Polyline, Tooltip, useMapEvents } from 'react-leaflet';
import {
  insertVertex,
  outerRings,
  positionKey,
  removeVertex,
  updateVertex,
  vertices,
  type GeoEditorMode,
  type Position,
  type VertexRef,
} from '../../../../lib/gis/geoEditor';

interface Props {
  mode: GeoEditorMode;
  features: GeoJSON.Feature[];
  selectedFeatureId: string | null;
  drawing: Position[];
  snappingEnabled: boolean;
  showDraft: boolean;
  onDrawingChange: (positions: Position[]) => void;
  onFeaturesChange: (features: GeoJSON.Feature[]) => void;
}

function closestVertex(position: Position, refs: VertexRef[], excluded: Position[] = [], threshold = 0.001): VertexRef | null {
  const excludedKeys = new Set(excluded.map((candidate) => positionKey(candidate)));
  let best: VertexRef | null = null;
  let bestDistance = Infinity;
  refs.forEach((ref) => {
    if (excludedKeys.has(positionKey(ref.position))) return;
    const distance = Math.hypot(ref.position[0] - position[0], ref.position[1] - position[1]);
    if (distance < threshold && distance < bestDistance) { best = ref; bestDistance = distance; }
  });
  return best;
}

function vertexIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:13px;height:13px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 5px rgba(0,0,0,.65)"></span>`,
    iconSize: [13, 13], iconAnchor: [6, 6],
  });
}

const editIcon = vertexIcon('#2563eb');
const drawIcon = vertexIcon('#ec4899');

export const DatasetGeoEditorLayer: React.FC<Props> = ({ mode, features = [], selectedFeatureId, drawing = [], snappingEnabled, showDraft, onDrawingChange, onFeaturesChange }) => {
  const [mousePosition, setMousePosition] = useState<Position | null>(null);
  const [selectedVertex, setSelectedVertex] = useState<VertexRef | null>(null);
  const allVertices = useMemo(() => vertices(features), [features]);

  useMapEvents({
    click(event) {
      if (mode !== 'draw') return;
      const raw: Position = [event.latlng.lng, event.latlng.lat];
      const snapped = snappingEnabled ? closestVertex(raw, allVertices, drawing)?.position : null;
      onDrawingChange([...drawing, snapped ? [...snapped] as Position : raw]);
    },
    mousemove(event) {
      if (mode !== 'draw') return;
      const raw: Position = [event.latlng.lng, event.latlng.lat];
      const snapped = snappingEnabled ? closestVertex(raw, allVertices, drawing)?.position : null;
      setMousePosition(snapped ? [...snapped] as Position : raw);
    },
  });

  const draftOverlay = <GeoJSON key={JSON.stringify(features.map((feature) => feature.geometry))} data={{ type: 'FeatureCollection', features } as GeoJSON.FeatureCollection} interactive={false} style={() => ({ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: .08, weight: 3, dashArray: '7 5' })} />;

  if (mode === 'view') return showDraft ? <LayerGroup>{draftOverlay}</LayerGroup> : null;

  if (mode === 'draw') {
    const preview = mousePosition && drawing.length ? [drawing[drawing.length - 1], mousePosition] : [];
    return <LayerGroup>{draftOverlay}
      {drawing.length >= 3 ? <Polygon positions={drawing.map(([lng, lat]) => [lat, lng])} pathOptions={{ color: '#ec4899', fillColor: '#ec4899', fillOpacity: .12, dashArray: '5 5', weight: 3 }} /> : drawing.length > 1 ? <Polyline positions={drawing.map(([lng, lat]) => [lat, lng])} pathOptions={{ color: '#ec4899', dashArray: '5 5', weight: 3 }} /> : null}
      {preview.length === 2 && <Polyline positions={preview.map(([lng, lat]) => [lat, lng])} pathOptions={{ color: '#ec4899', dashArray: '5 5', weight: 2 }} />}
      {allVertices.map((ref) => <CircleMarker key={`snap-${ref.featureIndex}-${ref.polygonIndex}-${ref.vertexIndex}`} center={[ref.position[1], ref.position[0]]} radius={3} interactive={false} pathOptions={{ color: '#64748b', fillColor: '#cbd5e1', fillOpacity: .6, weight: 1 }} />)}
      {drawing.map((position, index) => <Marker key={`draw-${index}`} position={[position[1], position[0]]} icon={drawIcon} />)}
      {mousePosition && <CircleMarker center={[mousePosition[1], mousePosition[0]]} radius={6} pathOptions={{ color: closestVertex(mousePosition, allVertices, drawing, .0000001) ? '#ef4444' : '#ec4899', fillOpacity: .25 }} />}
    </LayerGroup>;
  }

  if (mode === 'edit-shared') {
    const unique = new Map<string, VertexRef>();
    allVertices.forEach((ref) => { if (!unique.has(positionKey(ref.position))) unique.set(positionKey(ref.position), ref); });
    const segments = new Map<string, { ref: VertexRef; midpoint: Position }>();
    features.forEach((feature, featureIndex) => outerRings(feature.geometry).forEach((ring, polygonIndex) => ring.forEach((position, vertexIndex) => {
      const following = ring[(vertexIndex + 1) % ring.length];
      const key = [positionKey(position), positionKey(following)].sort().join('|');
      if (!segments.has(key)) segments.set(key, { ref: { featureIndex, polygonIndex, ringIndex: 0, vertexIndex, position }, midpoint: [(position[0] + following[0]) / 2, (position[1] + following[1]) / 2] });
    })));
    return <LayerGroup>{draftOverlay}
      {[...unique.values()].map((ref) => <Marker key={positionKey(ref.position)} position={[ref.position[1], ref.position[0]]} icon={editIcon} draggable eventHandlers={{ dragend: (event) => { const point = event.target.getLatLng(); onFeaturesChange(updateVertex(features, ref, [point.lng, point.lat], true)); }, contextmenu: (event) => { event.originalEvent.preventDefault(); onFeaturesChange(removeVertex(features, ref, true)); } }} />)}
      {[...segments.values()].map(({ ref, midpoint }) => <CircleMarker key={`mid-${positionKey(midpoint)}`} center={[midpoint[1], midpoint[0]]} radius={5} pathOptions={{ color: '#9333ea', fillColor: '#fff', fillOpacity: 1, weight: 2 }} eventHandlers={{ click: () => onFeaturesChange(insertVertex(features, ref, midpoint, true)) }}><Tooltip>Insert shared vertex</Tooltip></CircleMarker>)}
    </LayerGroup>;
  }

  const selectedIndex = features.findIndex((feature) => String(feature.id ?? feature.properties?.id) === selectedFeatureId);
  if (selectedIndex < 0) return null;
  const selectedRefs = allVertices.filter((ref) => ref.featureIndex === selectedIndex);
  const snapTargets = allVertices.filter((ref) => ref.featureIndex !== selectedIndex);
  return <LayerGroup>{draftOverlay}
    {snappingEnabled && selectedVertex && snapTargets.map((target) => <CircleMarker key={`target-${positionKey(target.position)}`} center={[target.position[1], target.position[0]]} radius={6} pathOptions={{ color: '#f59e0b', fillColor: '#fff7ed', fillOpacity: 1, weight: 2 }} eventHandlers={{ click: () => { onFeaturesChange(updateVertex(features, selectedVertex, target.position, false)); setSelectedVertex(null); } }} />)}
    {selectedRefs.map((ref) => {
      const ring = outerRings(features[selectedIndex].geometry)[ref.polygonIndex];
      const following = ring[(ref.vertexIndex + 1) % ring.length];
      const midpoint: Position = [(ref.position[0] + following[0]) / 2, (ref.position[1] + following[1]) / 2];
      return <Fragment key={`single-${ref.polygonIndex}-${ref.vertexIndex}`}>
        <Marker position={[ref.position[1], ref.position[0]]} icon={editIcon} draggable={!snappingEnabled} eventHandlers={{ click: () => snappingEnabled && setSelectedVertex((current) => current?.vertexIndex === ref.vertexIndex && current.polygonIndex === ref.polygonIndex ? null : ref), dragend: (event) => { if (snappingEnabled) return; const point = event.target.getLatLng(); onFeaturesChange(updateVertex(features, ref, [point.lng, point.lat], false)); }, contextmenu: (event) => { event.originalEvent.preventDefault(); onFeaturesChange(removeVertex(features, ref, false)); } }} />
        <CircleMarker center={[midpoint[1], midpoint[0]]} radius={5} pathOptions={{ color: '#9333ea', fillColor: '#fff', fillOpacity: 1, weight: 2 }} eventHandlers={{ click: () => onFeaturesChange(insertVertex(features, ref, midpoint, false)) }} />
      </Fragment>;
    })}
  </LayerGroup>;
};
