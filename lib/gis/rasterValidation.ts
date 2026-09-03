export const WEB_MAP_CRS = 'EPSG:3857';

export interface RasterBandMetadata {
  band: number;
  dataType: string;
  noData: number | null;
  minimum: number;
  maximum: number;
}

export interface RasterMetadata {
  id: string;
  format: 'COG';
  crs: string;
  width: number;
  height: number;
  pixelSize: [number, number];
  extentWgs84: [number, number, number, number];
  bands: RasterBandMetadata[];
  hasOverviews: boolean;
  verifiedAt: string;
}

export interface RasterContract {
  id: string;
  nativeCrs: string;
  bandCount: number;
  valueRange: [number, number];
  requireNoData: boolean;
}

/** Metadata verified from an authoritative WMS product specification. WMS is
 * rendered server-side, so it has no browser-delivered COG dimensions/overviews. */
export interface WmsRasterMetadata {
  crs: string;
  pixelSize: [number, number];
  extentWgs84: [number, number, number, number];
  bands: RasterBandMetadata[];
  verifiedAt: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Kept deliberately a little wider than the state boundary so edge pixels are
// not rejected because of normal clipping/resampling tolerances.
const BIH_WGS84_EXTENT: [number, number, number, number] = [15.70, 42.50, 19.70, 45.40];

const normalizeCrs = (value: string) => {
  const match = value.toUpperCase().match(/EPSG(?::|::|\/0\/)(\d+)$/);
  return match ? `EPSG:${match[1]}` : value.toUpperCase();
};

const extentsIntersect = (
  [minX, minY, maxX, maxY]: [number, number, number, number],
  [otherMinX, otherMinY, otherMaxX, otherMaxY]: [number, number, number, number],
) => minX < otherMaxX && maxX > otherMinX && minY < otherMaxY && maxY > otherMinY;

export function validateRasterMetadata(metadata: RasterMetadata, contract: RasterContract): ValidationResult {
  const errors: string[] = [];
  const finite = (value: number) => Number.isFinite(value);

  if (metadata.id !== contract.id) errors.push(`Manifest id ${metadata.id} does not match ${contract.id}.`);
  if (metadata.format !== 'COG') errors.push('Browser-facing source must be a Cloud Optimized GeoTIFF.');
  if (normalizeCrs(metadata.crs) !== normalizeCrs(contract.nativeCrs)) {
    errors.push(`Native CRS ${metadata.crs} does not match ${contract.nativeCrs}.`);
  }
  if (!Number.isInteger(metadata.width) || metadata.width <= 0 || !Number.isInteger(metadata.height) || metadata.height <= 0) {
    errors.push('Raster dimensions must be positive integers.');
  }
  if (metadata.pixelSize.length !== 2 || metadata.pixelSize.some((value) => !finite(value) || value === 0)) {
    errors.push('Pixel resolution must contain two finite, non-zero values.');
  }
  if (metadata.extentWgs84.length !== 4 || metadata.extentWgs84.some((value) => !finite(value))) {
    errors.push('WGS84 extent is missing or invalid.');
  } else if (!extentsIntersect(metadata.extentWgs84, BIH_WGS84_EXTENT)) {
    errors.push('Raster extent does not intersect Bosnia and Herzegovina.');
  }
  if (metadata.bands.length !== contract.bandCount) {
    errors.push(`Expected ${contract.bandCount} raster band(s), received ${metadata.bands.length}.`);
  }

  metadata.bands.forEach((band, index) => {
    if (band.band !== index + 1) errors.push(`Raster band ${index + 1} has an invalid band index.`);
    if (!finite(band.minimum) || !finite(band.maximum) || band.minimum > band.maximum) {
      errors.push(`Raster band ${band.band} has invalid statistics.`);
    } else if (band.minimum < contract.valueRange[0] || band.maximum > contract.valueRange[1]) {
      errors.push(`Raster band ${band.band} values ${band.minimum}..${band.maximum} exceed ${contract.valueRange[0]}..${contract.valueRange[1]}.`);
    }
    if (contract.requireNoData && (band.noData === null || !finite(band.noData))) {
      errors.push(`Raster band ${band.band} has no explicit NoData value.`);
    }
  });

  if (!metadata.hasOverviews && Math.max(metadata.width, metadata.height) > 512) {
    errors.push('COG has no internal overviews despite exceeding one map tile.');
  }
  if (!metadata.verifiedAt || Number.isNaN(Date.parse(metadata.verifiedAt))) errors.push('Raster verification timestamp is invalid.');

  return { valid: errors.length === 0, errors };
}

export function validateWmsRasterMetadata(metadata: WmsRasterMetadata, contract: RasterContract): ValidationResult {
  const errors: string[] = [];
  const finite = (value: number) => Number.isFinite(value);
  if (normalizeCrs(metadata.crs) !== normalizeCrs(contract.nativeCrs)) errors.push(`Native CRS ${metadata.crs} does not match ${contract.nativeCrs}.`);
  if (metadata.pixelSize.length !== 2 || metadata.pixelSize.some((value) => !finite(value) || value === 0)) errors.push('Pixel resolution must contain two finite, non-zero values.');
  if (metadata.extentWgs84.length !== 4 || metadata.extentWgs84.some((value) => !finite(value)) || !extentsIntersect(metadata.extentWgs84, BIH_WGS84_EXTENT)) errors.push('WMS source extent does not intersect Bosnia and Herzegovina.');
  if (metadata.bands.length !== contract.bandCount) errors.push(`Expected ${contract.bandCount} raster band(s), received ${metadata.bands.length}.`);
  metadata.bands.forEach((band, index) => {
    if (band.band !== index + 1) errors.push(`Raster band ${index + 1} has an invalid band index.`);
    if (!finite(band.minimum) || !finite(band.maximum) || band.minimum > band.maximum || band.minimum < contract.valueRange[0] || band.maximum > contract.valueRange[1]) errors.push(`Raster band ${band.band} has values outside the declared range.`);
    if (contract.requireNoData && (band.noData === null || !finite(band.noData))) errors.push(`Raster band ${band.band} has no explicit NoData value.`);
  });
  if (!metadata.verifiedAt || Number.isNaN(Date.parse(metadata.verifiedAt))) errors.push('WMS source verification timestamp is invalid.');
  return { valid: errors.length === 0, errors };
}

function directChildren(element: Element, localName: string): Element[] {
  return Array.from(element.children).filter((child) => child.localName === localName);
}

function findNamedLayer(root: Element, layerName: string): Element | null {
  for (const layer of Array.from(root.getElementsByTagNameNS('*', 'Layer'))) {
    const name = directChildren(layer, 'Name')[0]?.textContent?.trim();
    if (name === layerName) return layer;
  }
  return null;
}

function inheritedValues(layer: Element, localName: string): string[] {
  const values: string[] = [];
  let current: Element | null = layer;
  while (current) {
    directChildren(current, localName).forEach((node) => {
      if (node.textContent?.trim()) values.push(node.textContent.trim());
    });
    current = current.parentElement?.localName === 'Layer' ? current.parentElement : null;
  }
  return values;
}

export function validateWmsCapabilities(xml: string, layerName: string, mapCrs = WEB_MAP_CRS): ValidationResult {
  const errors: string[] = [];
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (document.getElementsByTagName('parsererror').length > 0) return { valid: false, errors: ['Invalid WMS capabilities XML.'] };

  const root = document.documentElement;
  if (root.localName !== 'WMS_Capabilities' && root.localName !== 'WMT_MS_Capabilities') {
    errors.push('Response is not a WMS capabilities document.');
  }
  const layer = findNamedLayer(root, layerName);
  if (!layer) return { valid: false, errors: [...errors, `WMS layer ${layerName} was not advertised.`] };

  const advertisedCrs = [...inheritedValues(layer, 'CRS'), ...inheritedValues(layer, 'SRS')].map(normalizeCrs);
  if (!advertisedCrs.includes(normalizeCrs(mapCrs))) errors.push(`WMS layer ${layerName} does not advertise ${mapCrs}.`);

  const formats = Array.from(root.getElementsByTagNameNS('*', 'GetMap'))
    .flatMap((node) => Array.from(node.getElementsByTagNameNS('*', 'Format')))
    .map((node) => node.textContent?.trim().toLowerCase());
  if (!formats.includes('image/png')) errors.push('WMS GetMap does not advertise image/png transparency support.');

  return { valid: errors.length === 0, errors };
}

export function validateGeneratedRaster(
  values: ArrayLike<number>,
  noData: number,
  bounds: { west: number; east: number; south: number; north: number },
  displayRange: [number, number],
): ValidationResult {
  const errors: string[] = [];
  if (![bounds.west, bounds.east, bounds.south, bounds.north].every(Number.isFinite)
    || bounds.west >= bounds.east || bounds.south >= bounds.north) {
    errors.push('Generated raster extent is invalid.');
  }
  const validValues = Array.from(values).filter((value) => value !== noData);
  if (validValues.length === 0) errors.push('Generated raster contains only NoData pixels.');
  if (validValues.some((value) => !Number.isFinite(value))) errors.push('Generated raster contains non-finite values.');
  if (validValues.some((value) => value < displayRange[0] || value > displayRange[1])) {
    errors.push(`Generated raster values exceed display range ${displayRange[0]}..${displayRange[1]}.`);
  }
  return { valid: errors.length === 0, errors };
}
