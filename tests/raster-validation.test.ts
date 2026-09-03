import { describe, expect, it } from 'vitest';
import {
  validateGeneratedRaster,
  validateRasterMetadata,
  validateWmsCapabilities,
  type RasterMetadata,
} from '../lib/gis/rasterValidation';

const metadata: RasterMetadata = {
  id: 'Fagus sylvatica suitability',
  format: 'COG',
  crs: 'EPSG:4326',
  width: 48,
  height: 35,
  pixelSize: [0.083333333, 0.083333333],
  extentWgs84: [15.7, 42.5, 19.7, 45.4],
  bands: [{ band: 1, dataType: 'Int16', noData: -9999, minimum: 0, maximum: 997 }],
  hasOverviews: true,
  verifiedAt: '2026-09-03T10:00:00Z',
};

describe('raster validation', () => {
  it('accepts a verified BiH COG matching its data contract', () => {
    expect(validateRasterMetadata(metadata, {
      id: metadata.id,
      nativeCrs: 'EPSG:4326',
      bandCount: 1,
      valueRange: [0, 1000],
      requireNoData: true,
    })).toEqual({ valid: true, errors: [] });
  });

  it('fails closed for a raw GeoTIFF, missing NoData, bad extent and range', () => {
    const result = validateRasterMetadata({
      ...metadata,
      format: 'GTiff' as 'COG',
      width: 1000,
      extentWgs84: [-10, -10, -9, -9],
      bands: [{ ...metadata.bands[0], noData: null, maximum: 1001 }],
      hasOverviews: false,
    }, {
      id: metadata.id,
      nativeCrs: 'EPSG:4326',
      bandCount: 1,
      valueRange: [0, 1000],
      requireNoData: true,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(5);
  });

  it('requires the WMS layer, Web Mercator reprojection and PNG output', () => {
    const xml = `<?xml version="1.0"?>
      <WMS_Capabilities xmlns="http://www.opengis.net/wms" version="1.3.0">
        <Capability>
          <Request><GetMap><Format>image/png</Format></GetMap></Request>
          <Layer><CRS>EPSG:3857</CRS><Layer><Name>nffis:fagus</Name></Layer></Layer>
        </Capability>
      </WMS_Capabilities>`;

    expect(validateWmsCapabilities(xml, 'nffis:fagus')).toEqual({ valid: true, errors: [] });
    expect(validateWmsCapabilities(xml.replace('EPSG:3857', 'EPSG:3035'), 'nffis:fagus').valid).toBe(false);
  });

  it('checks generated client rasters before creating a GeoTIFF blob', () => {
    expect(validateGeneratedRaster(
      new Float32Array([-9999, 0.2, 0.8]),
      -9999,
      { west: 15.7, east: 19.7, south: 42.5, north: 45.4 },
      [0, 1],
    ).valid).toBe(true);
    expect(validateGeneratedRaster(
      new Float32Array([-9999, 1.2]),
      -9999,
      { west: 15.7, east: 19.7, south: 42.5, north: 45.4 },
      [0, 1],
    ).valid).toBe(false);
  });
});
