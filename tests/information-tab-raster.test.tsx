import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InformationTab } from '../components/Layers/EditLayerSidebar/InformationTab';
import type { DatasetLayer } from '../services/datasetService';

const raster = {
  id: 3341,
  table_schema: 'external',
  table_name: 'bih_esa_worldcover_2021',
  display_name: 'BiH ESA WorldCover 2021 land cover (100 m)',
  jurisdiction: 'fbih',
  category: 'forest',
  subcategory: 'land cover vegetation',
  geometry_family: 'raster',
  geometry_type: 'RASTER',
  layer_kind: 'raster',
  nearest_road_enabled: false,
  srid: 4326,
  feature_count: 1,
  bounds: { scope: 'BIH', resolution_m: 100 },
  style: {},
  filter_fields: [],
  visible_by_default: false,
} as DatasetLayer;

describe('InformationTab raster metadata', () => {
  it('renders a raster with metadata-only bounds without crashing', () => {
    render(<InformationTab layer={raster} canEdit={false} canManageDataDelivery={false} />);

    expect(screen.getByText('Cloud Optimized GeoTIFF')).toBeInTheDocument();
    expect(screen.getByText('100 m')).toBeInTheDocument();
    expect(screen.getByText('No bounds available')).toBeInTheDocument();
    expect(screen.getByText('Land-cover legend')).toBeInTheDocument();
    expect(screen.getByText('Tree cover')).toBeInTheDocument();
    expect(screen.getByText('Permanent water bodies')).toBeInTheDocument();
  });

  it('renders numeric raster bounds when supplied', () => {
    render(<InformationTab layer={{ ...raster, bounds: { ...raster.bounds, minx: 17.35, miny: 42.6, maxx: 18.37, maxy: 43.88 } }} canEdit={false} canManageDataDelivery={false} />);

    expect(screen.getByText('17.350000')).toBeInTheDocument();
    expect(screen.getByText('43.880000')).toBeInTheDocument();
  });
});
