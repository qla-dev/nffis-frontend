import { MapLayer } from '../../types';
import type { RasterContract, RasterMetadata, WmsRasterMetadata } from './rasterValidation';

export type ForestRasterDataType = 'forest_type' | 'modelled_probability';

export interface ForestRasterLayerDefinition {
  id: MapLayer;
  label: { en: string; bs: string; ja: string };
  scientificName?: string;
  dataType: ForestRasterDataType;
  source: string;
  sourceUrl: string;
  dataset: string;
  year: string;
  resolution: string;
  unit: string;
  license: string;
  attribution: string;
  wmsLayerName: string;
  wmsUrl?: string;
  /** Coarser companion WMS layer used for country-scale rendering. */
  overviewWmsLayerName?: string;
  wmsMetadata?: WmsRasterMetadata;
  opacity: number;
  /** Zoom interval in which the source has meaningful spatial detail. */
  minRenderZoom?: number;
  maxRenderZoom?: number;
  contract: RasterContract;
}

const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;

export const FOREST_WMS_URL = (env.VITE_FOREST_WMS_URL || '').trim();
export const PUBLIC_FOREST_TYPE_WMS_URL = (env.VITE_FOREST_TYPE_WMS_URL || '/eea-forest-wms').trim();
export const FOREST_RASTER_MANIFEST_URL = (env.VITE_FOREST_RASTER_MANIFEST_URL || '/forest-rasters/manifest.json').trim();

const species = (
  id: MapLayer,
  bsName: string,
  englishName: string,
  scientificName: string,
  envName: string,
): ForestRasterLayerDefinition => ({
  id,
  label: {
    en: `${englishName} — modelled suitability`,
    bs: `${bsName} — modelirana pogodnost staništa`,
    ja: `${englishName} — モデル化された生育適地`,
  },
  scientificName,
  dataType: 'modelled_probability',
  source: 'European Commission, Joint Research Centre',
  sourceUrl: 'https://forest.jrc.ec.europa.eu/en/activities/forests-and-climate-change/',
  dataset: 'EU-Trees4F, current climatic suitability ensemble',
  year: '1991–2020 baseline',
  resolution: '5 arc-minutes (approximately 10 km)',
  unit: 'ensemble probability, stored as integer 0–1000',
  license: 'European Commission reuse policy; verify the downloaded package metadata',
  attribution: 'European Commission JRC — EU-Trees4F (Mauri et al., 2022)',
  wmsLayerName: (env[envName] || '').trim(),
  opacity: 0.68,
  // EU-Trees4F is a 5 arc-minute (~10 km) model. Do not upscale it at street-scale zooms.
  maxRenderZoom: 9,
  contract: { id: id, nativeCrs: 'EPSG:4326', bandCount: 1, valueRange: [0, 1000], requireNoData: true },
});

export const FOREST_RASTER_LAYERS: readonly ForestRasterLayerDefinition[] = [
  {
    id: MapLayer.FOREST_TYPE,
    label: { en: 'Forest Type — broadleaved / coniferous', bs: 'Tip šume — listopadna / četinarska', ja: '森林タイプ' },
    dataType: 'forest_type',
    source: 'European Environment Agency / Copernicus Land Monitoring Service',
    sourceUrl: 'https://land.copernicus.eu/en/products/high-resolution-layer-forests-and-tree-cover',
    dataset: 'High Resolution Layer Forest Type 2015, 20 m (public WMS)',
    year: '2015',
    resolution: '20 m',
    unit: '20 m: 0 non-forest, 1 broadleaved, 2 coniferous; 100 m overview also includes 3 mixed forest; 255 outside coverage',
    license: 'Copernicus data and information policy',
    attribution: 'European Union, Copernicus Land Monitoring Service',
    wmsUrl: PUBLIC_FOREST_TYPE_WMS_URL,
    wmsLayerName: (env.VITE_FOREST_TYPE_WMS_LAYER || 'HRL_Forest_Type_2015_20m795').trim(),
    overviewWmsLayerName: (env.VITE_FOREST_TYPE_OVERVIEW_WMS_LAYER || 'HRL_Forest_Type_2015_100m18936').trim(),
    wmsMetadata: {
      crs: 'EPSG:3035',
      pixelSize: [20, 20],
      extentWgs84: [-56.0, 24.0, 73.0, 68.0],
      bands: [{ band: 1, dataType: 'UInt8', noData: 255, minimum: 0, maximum: 3 }],
      verifiedAt: '2026-09-03T00:00:00.000Z',
    },
    opacity: 0.72,
    contract: { id: MapLayer.FOREST_TYPE, nativeCrs: 'EPSG:3035', bandCount: 1, valueRange: [0, 255], requireNoData: true },
  },
  species(MapLayer.FOREST_FAGUS, 'Bukva', 'European beech', 'Fagus sylvatica', 'VITE_FOREST_FAGUS_WMS_LAYER'),
  species(MapLayer.FOREST_ABIES, 'Jela', 'Silver fir', 'Abies alba', 'VITE_FOREST_ABIES_WMS_LAYER'),
  species(MapLayer.FOREST_PICEA, 'Smrča', 'Norway spruce', 'Picea abies', 'VITE_FOREST_PICEA_WMS_LAYER'),
  species(MapLayer.FOREST_PINUS_NIGRA, 'Crni bor', 'Black pine', 'Pinus nigra', 'VITE_FOREST_PINUS_NIGRA_WMS_LAYER'),
  species(MapLayer.FOREST_PINUS_SYLVESTRIS, 'Bijeli bor', 'Scots pine', 'Pinus sylvestris', 'VITE_FOREST_PINUS_SYLVESTRIS_WMS_LAYER'),
  species(MapLayer.FOREST_QUERCUS_PETRAEA, 'Kitnjak', 'Sessile oak', 'Quercus petraea', 'VITE_FOREST_QUERCUS_PETRAEA_WMS_LAYER'),
  species(MapLayer.FOREST_QUERCUS_ROBUR, 'Lužnjak', 'Pedunculate oak', 'Quercus robur', 'VITE_FOREST_QUERCUS_ROBUR_WMS_LAYER'),
  species(MapLayer.FOREST_QUERCUS_CERRIS, 'Cer', 'Turkey oak', 'Quercus cerris', 'VITE_FOREST_QUERCUS_CERRIS_WMS_LAYER'),
  species(MapLayer.FOREST_CASTANEA, 'Pitomi kesten', 'Sweet chestnut', 'Castanea sativa', 'VITE_FOREST_CASTANEA_WMS_LAYER'),
] as const;

export const FOREST_RASTER_LAYER_IDS = FOREST_RASTER_LAYERS.map((layer) => layer.id);

export function metadataForLayer(manifest: RasterMetadata[], id: MapLayer): RasterMetadata | undefined {
  return manifest.find((item) => item.id === id);
}
