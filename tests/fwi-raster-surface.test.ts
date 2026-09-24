import { describe, expect, it } from 'vitest';
import {
  createFwiRasterSurface,
  FWI_RASTER_HEIGHT,
  FWI_RASTER_WIDTH,
} from '../lib/fwi/fwiRasterSurface';
import { sampleBilinearRgba } from '../lib/fwi/smoothRasterTransform';

describe('FWI raster presentation', () => {
  it('generates the higher-resolution display surface without changing input values', () => {
    const points = [
      { id: 'west', lat: 44, lng: 17, value: 10 },
      { id: 'east', lat: 44, lng: 19, value: 70 },
    ];
    const startedAt = performance.now();
    const raster = createFwiRasterSurface(
      points,
      (point) => point.value,
      0.42,
      { west: 16, east: 20, south: 42, north: 46 },
    );

    expect(raster.width).toBe(FWI_RASTER_WIDTH);
    expect(raster.height).toBe(FWI_RASTER_HEIGHT);
    expect(raster.data).toHaveLength(512 * 512);
    expect(raster.data[256 * 512 + 64]).toBeLessThan(raster.data[256 * 512 + 448]);
    // Wide enough for slower CI while still catching accidental pathological work.
    expect(performance.now() - startedAt).toBeLessThan(3000);
  });

  it('bilinearly blends adjacent colours and transparent mask edges', () => {
    const source = {
      width: 2,
      height: 1,
      data: new Uint8ClampedArray([
        0, 200, 0, 255,
        255, 0, 0, 0,
      ]),
    };

    const middle = sampleBilinearRgba(source, 0.5, 0);
    expect(middle[0]).toBe(0);
    expect(middle[1]).toBe(200);
    expect(middle[3]).toBeCloseTo(128, 0);
  });
});
