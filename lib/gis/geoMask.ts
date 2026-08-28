export type PreparedMaskPolygon = {
  rings: number[][][];
  west: number;
  east: number;
  south: number;
  north: number;
};

export function prepareMaskPolygons(mask?: GeoJSON.FeatureCollection): PreparedMaskPolygon[] {
  const polygons: number[][][][] = [];
  mask?.features.forEach((feature) => {
    if (feature.geometry?.type === 'Polygon') polygons.push(feature.geometry.coordinates);
    if (feature.geometry?.type === 'MultiPolygon') polygons.push(...feature.geometry.coordinates);
  });

  return polygons.filter((rings) => rings[0]?.length >= 3).map((rings) => {
    const longitudes = rings[0].map((position) => position[0]);
    const latitudes = rings[0].map((position) => position[1]);
    return {
      rings,
      west: Math.min(...longitudes),
      east: Math.max(...longitudes),
      south: Math.min(...latitudes),
      north: Math.max(...latitudes),
    };
  });
}

function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [currentLng, currentLat] = ring[index];
    const [previousLng, previousLat] = ring[previous];
    if ((currentLat > lat) !== (previousLat > lat)
      && lng < ((previousLng - currentLng) * (lat - currentLat)) / (previousLat - currentLat) + currentLng) inside = !inside;
  }
  return inside;
}

export function pointInPreparedMask(lng: number, lat: number, polygons: PreparedMaskPolygon[]): boolean {
  return polygons.some((polygon) => (
    lng >= polygon.west && lng <= polygon.east && lat >= polygon.south && lat <= polygon.north
    && pointInRing(lng, lat, polygon.rings[0])
    && !polygon.rings.slice(1).some((hole) => pointInRing(lng, lat, hole))
  ));
}
