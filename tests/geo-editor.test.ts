import { describe, expect, it } from 'vitest';
import { changedFeatures, insertVertex, removeVertex, updateVertex, vertices } from '../lib/gis/geoEditor';

const polygon = (id: number, outer: number[][], hole?: number[][]): GeoJSON.Feature => ({
  type: 'Feature', id, properties: { id, source: 'postgis' },
  geometry: { type: 'Polygon', coordinates: hole ? [outer, hole] : [outer] },
});

describe('GeoEditor geometry operations', () => {
  it('moves exact shared vertices across polygons while preserving holes and attributes', () => {
    const hole = [[.2, .2], [.4, .2], [.4, .4], [.2, .2]];
    const features = [polygon(1, [[0, 0], [1, 0], [1, 1], [0, 0]], hole), polygon(2, [[1, 0], [2, 0], [2, 1], [1, 0]])];
    const ref = vertices(features).find((vertex) => vertex.featureIndex === 0 && vertex.position[0] === 1 && vertex.position[1] === 0)!;
    const edited = updateVertex(features, ref, [1.1, .1], true);
    expect((edited[0].geometry as GeoJSON.Polygon).coordinates[1]).toEqual(hole);
    expect((edited[1].geometry as GeoJSON.Polygon).coordinates[0][0]).toEqual([1.1, .1]);
    expect(edited[0].properties?.source).toBe('postgis');
    expect(changedFeatures(features, edited)).toHaveLength(2);
  });

  it('inserts and removes outer-ring vertices without producing invalid three-point rings', () => {
    const features = [polygon(1, [[0, 0], [2, 0], [2, 2], [0, 0]])];
    const ref = vertices(features)[0];
    const inserted = insertVertex(features, ref, [1, 0], false);
    expect((inserted[0].geometry as GeoJSON.Polygon).coordinates[0]).toHaveLength(5);
    const reduced = removeVertex(inserted, vertices(inserted)[1], false);
    expect((reduced[0].geometry as GeoJSON.Polygon).coordinates[0]).toHaveLength(4);
    expect(removeVertex(reduced, vertices(reduced)[0], false)).toEqual(reduced);
  });
});
