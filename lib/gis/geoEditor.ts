export type Position = [number, number];
export type GeoEditorMode = 'view' | 'draw' | 'edit-single' | 'edit-shared';

export interface VertexRef {
  featureIndex: number;
  polygonIndex: number;
  ringIndex: number;
  vertexIndex: number;
  position: Position;
}

export function cloneFeatures(features: GeoJSON.Feature[]): GeoJSON.Feature[] {
  return structuredClone(features);
}

export function samePosition(left: Position, right: Position): boolean {
  return left[0] === right[0] && left[1] === right[1];
}

export function positionKey(position: Position, precision = 9): string {
  return `${position[0].toFixed(precision)}:${position[1].toFixed(precision)}`;
}

export function openRing(ring: Position[] | null | undefined): Position[] {
  if (!Array.isArray(ring)) return [];
  if (ring.length > 1 && samePosition(ring[0], ring[ring.length - 1])) return ring.slice(0, -1);
  return [...ring];
}

export function closeRing(ring: Position[] | null | undefined): Position[] {
  const open = openRing(ring);
  return open.length >= 3 ? [...open, [...open[0]] as Position] : open;
}

export function outerRings(geometry: GeoJSON.Geometry | null | undefined): Position[][] {
  if (geometry?.type === 'Polygon') return [openRing(geometry.coordinates?.[0] as Position[])].filter((ring) => ring.length >= 3);
  if (geometry?.type === 'MultiPolygon') return (geometry.coordinates || []).map((polygon) => openRing(polygon?.[0] as Position[])).filter((ring) => ring.length >= 3);
  return [];
}

export function vertices(features: GeoJSON.Feature[]): VertexRef[] {
  const result: VertexRef[] = [];
  (features || []).forEach((feature, featureIndex) => {
    if (feature.geometry?.type === 'Polygon') {
      openRing(feature.geometry.coordinates[0] as Position[]).forEach((position, vertexIndex) => result.push({ featureIndex, polygonIndex: 0, ringIndex: 0, vertexIndex, position }));
    } else if (feature.geometry?.type === 'MultiPolygon') {
      (feature.geometry.coordinates || []).forEach((polygon, polygonIndex) => openRing(polygon?.[0] as Position[]).forEach((position, vertexIndex) => result.push({ featureIndex, polygonIndex, ringIndex: 0, vertexIndex, position })));
    }
  });
  return result;
}

export function updateVertex(features: GeoJSON.Feature[], ref: VertexRef, position: Position, shared: boolean): GeoJSON.Feature[] {
  const oldPosition = ref.position;
  return features.map((feature, featureIndex) => {
    if (!shared && featureIndex !== ref.featureIndex) return feature;
    let changed = false;
    const next = structuredClone(feature);
    const replace = (ring: Position[]) => closeRing(openRing(ring).map((candidate, vertexIndex) => {
      const matches = shared ? samePosition(candidate, oldPosition) : featureIndex === ref.featureIndex && vertexIndex === ref.vertexIndex;
      if (matches) { changed = true; return [...position] as Position; }
      return candidate;
    }));
    if (next.geometry?.type === 'Polygon' && (shared || ref.polygonIndex === 0)) next.geometry.coordinates[0] = replace(next.geometry.coordinates[0] as Position[]);
    if (next.geometry?.type === 'MultiPolygon') next.geometry.coordinates = next.geometry.coordinates.map((polygon, polygonIndex) => {
      if (!shared && polygonIndex !== ref.polygonIndex) return polygon;
      polygon[0] = replace(polygon[0] as Position[]);
      return polygon;
    });
    return changed ? next : feature;
  });
}

export function removeVertex(features: GeoJSON.Feature[], ref: VertexRef, shared: boolean): GeoJSON.Feature[] {
  return features.map((feature, featureIndex) => {
    if (!shared && featureIndex !== ref.featureIndex) return feature;
    const next = structuredClone(feature);
    const remove = (ring: Position[]) => {
      const open = openRing(ring);
      const filtered = open.filter((candidate, vertexIndex) => !(shared ? samePosition(candidate, ref.position) : vertexIndex === ref.vertexIndex));
      return filtered.length >= 3 ? closeRing(filtered) : ring;
    };
    if (next.geometry?.type === 'Polygon') next.geometry.coordinates[0] = remove(next.geometry.coordinates[0] as Position[]);
    if (next.geometry?.type === 'MultiPolygon') next.geometry.coordinates = next.geometry.coordinates.map((polygon, polygonIndex) => {
      if (shared || polygonIndex === ref.polygonIndex) polygon[0] = remove(polygon[0] as Position[]);
      return polygon;
    });
    return next;
  });
}

export function insertVertex(features: GeoJSON.Feature[], ref: VertexRef, position: Position, shared: boolean): GeoJSON.Feature[] {
  const nextRefPosition = (() => {
    const feature = features[ref.featureIndex];
    const ring = outerRings(feature?.geometry)[ref.polygonIndex] || [];
    return ring[(ref.vertexIndex + 1) % ring.length];
  })();
  return features.map((feature, featureIndex) => {
    if (!shared && featureIndex !== ref.featureIndex) return feature;
    const next = structuredClone(feature);
    const insert = (ring: Position[]) => {
      const open = openRing(ring);
      const output: Position[] = [];
      open.forEach((candidate, index) => {
        output.push(candidate);
        const following = open[(index + 1) % open.length];
        const matches = shared
          ? (samePosition(candidate, ref.position) && samePosition(following, nextRefPosition)) || (samePosition(candidate, nextRefPosition) && samePosition(following, ref.position))
          : index === ref.vertexIndex;
        if (matches) output.push([...position] as Position);
      });
      return closeRing(output);
    };
    if (next.geometry?.type === 'Polygon') next.geometry.coordinates[0] = insert(next.geometry.coordinates[0] as Position[]);
    if (next.geometry?.type === 'MultiPolygon') next.geometry.coordinates = next.geometry.coordinates.map((polygon, polygonIndex) => {
      if (shared || polygonIndex === ref.polygonIndex) polygon[0] = insert(polygon[0] as Position[]);
      return polygon;
    });
    return next;
  });
}

export function changedFeatures(original: GeoJSON.Feature[], draft: GeoJSON.Feature[]): GeoJSON.Feature[] {
  const originalById = new Map(original.map((feature) => [String(feature.id ?? feature.properties?.id), feature]));
  return draft.filter((feature) => JSON.stringify(feature.geometry) !== JSON.stringify(originalById.get(String(feature.id ?? feature.properties?.id))?.geometry));
}
