interface RasterImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

interface RasterTransformArgs {
  plotWidth: number;
  plotHeight: number;
  xOrigin: number;
  yOrigin: number;
  lngSpan: number;
  latSpan: number;
}

interface LeafletGeoTiffContext {
  _map: any;
  _rasterBounds: {
    _southWest: { lat: number; lng: number };
  };
  raster: { width: number; height: number };
}

/** Bilinear RGBA lookup with premultiplied alpha, so NoData edges fade cleanly. */
export function writeBilinearRgba(
  source: RasterImage,
  sourceX: number,
  sourceY: number,
  output: Uint8ClampedArray,
  outputOffset: number,
): void {
  if (sourceX < -0.5 || sourceY < -0.5
    || sourceX > source.width - 0.5 || sourceY > source.height - 0.5) return;

  const x0 = Math.floor(sourceX);
  const y0 = Math.floor(sourceY);
  const xFraction = sourceX - x0;
  const yFraction = sourceY - y0;
  let alpha = 0;
  let red = 0;
  let green = 0;
  let blue = 0;
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const sourceData = source.data;

  if (x0 >= 0 && y0 >= 0 && x0 < source.width && y0 < source.height) {
    const offset = ((y0 * source.width) + x0) * 4;
    const alphaWeight = (sourceData[offset + 3] / 255) * (1 - xFraction) * (1 - yFraction);
    alpha += alphaWeight;
    red += sourceData[offset] * alphaWeight;
    green += sourceData[offset + 1] * alphaWeight;
    blue += sourceData[offset + 2] * alphaWeight;
  }
  if (x1 >= 0 && y0 >= 0 && x1 < source.width && y0 < source.height) {
    const offset = ((y0 * source.width) + x1) * 4;
    const alphaWeight = (sourceData[offset + 3] / 255) * xFraction * (1 - yFraction);
    alpha += alphaWeight;
    red += sourceData[offset] * alphaWeight;
    green += sourceData[offset + 1] * alphaWeight;
    blue += sourceData[offset + 2] * alphaWeight;
  }
  if (x0 >= 0 && y1 >= 0 && x0 < source.width && y1 < source.height) {
    const offset = ((y1 * source.width) + x0) * 4;
    const alphaWeight = (sourceData[offset + 3] / 255) * (1 - xFraction) * yFraction;
    alpha += alphaWeight;
    red += sourceData[offset] * alphaWeight;
    green += sourceData[offset + 1] * alphaWeight;
    blue += sourceData[offset + 2] * alphaWeight;
  }
  if (x1 >= 0 && y1 >= 0 && x1 < source.width && y1 < source.height) {
    const offset = ((y1 * source.width) + x1) * 4;
    const alphaWeight = (sourceData[offset + 3] / 255) * xFraction * yFraction;
    alpha += alphaWeight;
    red += sourceData[offset] * alphaWeight;
    green += sourceData[offset + 1] * alphaWeight;
    blue += sourceData[offset + 2] * alphaWeight;
  }

  if (alpha === 0) return;
  output[outputOffset] = Math.round(red / alpha);
  output[outputOffset + 1] = Math.round(green / alpha);
  output[outputOffset + 2] = Math.round(blue / alpha);
  output[outputOffset + 3] = Math.round(alpha * 255);
}

export function sampleBilinearRgba(
  source: RasterImage,
  sourceX: number,
  sourceY: number,
): [number, number, number, number] {
  const output = new Uint8ClampedArray(4);
  writeBilinearRgba(source, sourceX, sourceY, output, 0);
  return [output[0], output[1], output[2], output[3]];
}

/** Drop-in replacement for leaflet-geotiff's nearest-neighbour transform. */
export function smoothRasterTransform(
  this: LeafletGeoTiffContext,
  rasterImageData: ImageData,
  args: RasterTransformArgs,
): ImageData {
  const imageData = new ImageData(args.plotWidth, args.plotHeight);
  const output = imageData.data;
  const map = this._map;
  const zoom = map.getZoom();
  const scale = map.options.crs.scale(zoom);
  const degreesPerRadian = 57.29577951308232;
  const transformation = map.options.crs.transformation;
  const radius = map.options.crs.projection.R;
  const transformationA = transformation._a * radius;
  const transformationB = transformation._b;
  const transformationC = transformation._c * radius;
  const transformationD = transformation._d;
  const sourceXs = new Float64Array(args.plotWidth);
  for (let x = 0; x < args.plotWidth; x += 1) {
    const xUntransformed = ((args.xOrigin + x) / scale - transformationB) / transformationA;
    const longitude = xUntransformed * degreesPerRadian;
    sourceXs[x] = ((longitude - this._rasterBounds._southWest.lng) / args.lngSpan) - 0.5;
  }

  for (let y = 0; y < args.plotHeight; y += 1) {
    const yUntransformed = ((args.yOrigin + y) / scale - transformationD) / transformationC;
    const latitude = (2 * Math.atan(Math.exp(yUntransformed)) - (Math.PI / 2)) * degreesPerRadian;
    const sourceY = this.raster.height
      - ((latitude - this._rasterBounds._southWest.lat) / args.latSpan)
      - 0.5;

    for (let x = 0; x < args.plotWidth; x += 1) {
      const offset = ((y * args.plotWidth) + x) * 4;
      writeBilinearRgba(rasterImageData, sourceXs[x], sourceY, output, offset);
    }
  }

  return imageData;
}
