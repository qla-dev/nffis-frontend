export type Coordinate = [number, number];

export interface ScreenCoordinate {
  coordinate: Coordinate;
  x: number;
  y: number;
}

export interface SnapResult {
  coordinate: Coordinate;
  distance: number;
  kind: 'vertex' | 'segment';
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function snapToGeometry(
  pointer: { x: number; y: number },
  rings: ScreenCoordinate[][],
  tolerance = 14,
): SnapResult | null {
  let best: SnapResult | null = null;

  for (const ring of rings) {
    for (const point of ring) {
      const candidateDistance = distance(pointer.x, pointer.y, point.x, point.y);
      if (candidateDistance <= tolerance && (!best || candidateDistance < best.distance)) {
        best = { coordinate: point.coordinate, distance: candidateDistance, kind: 'vertex' };
      }
    }
  }
  if (best) return best;

  for (const ring of rings) {
    for (let index = 1; index < ring.length; index += 1) {
      const start = ring[index - 1];
      const end = ring[index];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const lengthSquared = dx * dx + dy * dy;
      if (lengthSquared === 0) continue;
      const t = Math.max(0, Math.min(1, ((pointer.x - start.x) * dx + (pointer.y - start.y) * dy) / lengthSquared));
      const x = start.x + t * dx;
      const y = start.y + t * dy;
      const candidateDistance = distance(pointer.x, pointer.y, x, y);
      if (candidateDistance <= tolerance && (!best || candidateDistance < best.distance)) {
        best = {
          coordinate: [
            start.coordinate[0] + t * (end.coordinate[0] - start.coordinate[0]),
            start.coordinate[1] + t * (end.coordinate[1] - start.coordinate[1]),
          ],
          distance: candidateDistance,
          kind: 'segment',
        };
      }
    }
  }

  return best;
}

export function polygonRings(geometry: GeoJSON.Geometry | null | undefined): Coordinate[][] {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return geometry.coordinates as Coordinate[][];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat() as Coordinate[][];
  return [];
}
