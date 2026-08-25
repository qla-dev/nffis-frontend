import { describe, expect, it } from 'vitest';
import { polygonRings, snapToGeometry } from '../lib/gis/snapping';

describe('GIS polygon snapping', () => {
  const ring = [[
    { coordinate: [18, 43] as [number, number], x: 0, y: 0 },
    { coordinate: [19, 43] as [number, number], x: 100, y: 0 },
  ]];

  it('prefers a nearby vertex', () => {
    expect(snapToGeometry({ x: 4, y: 3 }, ring, 10)).toMatchObject({ coordinate: [18, 43], kind: 'vertex', distance: 5 });
  });

  it('projects a point onto a nearby segment', () => {
    expect(snapToGeometry({ x: 40, y: 5 }, ring, 10)).toMatchObject({ coordinate: [18.4, 43], kind: 'segment', distance: 5 });
  });

  it('extracts all Polygon and MultiPolygon rings including holes', () => {
    const polygon: GeoJSON.Polygon = { type: 'Polygon', coordinates: [[[0, 0]], [[1, 1]]] };
    const multi: GeoJSON.MultiPolygon = { type: 'MultiPolygon', coordinates: [[[[0, 0]], [[1, 1]]], [[[2, 2]]]] };
    expect(polygonRings(polygon)).toHaveLength(2);
    expect(polygonRings(multi)).toHaveLength(3);
  });
});
