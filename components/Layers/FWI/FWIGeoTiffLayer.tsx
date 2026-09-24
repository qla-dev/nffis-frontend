import React, { useEffect, useMemo, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { writeArrayBuffer } from 'geotiff';
import '@qartlabs/leaflet-geotiff';
import '@qartlabs/leaflet-geotiff/leaflet-geotiff-plotty.js';
import {
  createFwiRasterSurface,
  FWI_NO_DATA_VALUE,
  FWI_RASTER_HEIGHT,
  FWI_RASTER_WIDTH,
  type FwiRasterPoint,
} from '../../../lib/fwi/fwiRasterSurface';
import { smoothRasterTransform } from '../../../lib/fwi/smoothRasterTransform';
import { validateGeneratedRaster } from '../../../lib/gis/rasterValidation';

export type { FwiRasterPoint } from '../../../lib/fwi/fwiRasterSurface';

interface FWIGeoTiffLayerProps<TPoint extends FwiRasterPoint> {
  points: TPoint[];
  visible: boolean;
  valueAccessor: (point: TPoint) => number;
  cellValueTransform?: (value: number, lat: number, lng: number) => number;
  displayMin: number;
  displayMax: number;
  colorScaleName?: string;
  rasterBounds?: {
    west: number;
    east: number;
    south: number;
    north: number;
  };
  rasterMask?: GeoJSON.FeatureCollection;
  debugLabel?: string;
  opacity?: number;
  influenceRadius?: number;
  pane?: string;
}

export const FWIGeoTiffLayer = <TPoint extends FwiRasterPoint>({
  points,
  visible,
  valueAccessor,
  cellValueTransform,
  displayMin,
  displayMax,
  colorScaleName,
  rasterBounds,
  rasterMask,
  debugLabel = colorScaleName || 'CustomScale',
  opacity = 0.72,
  influenceRadius = 0.42,
  pane,
}: FWIGeoTiffLayerProps<TPoint>) => {
  const map = useMap();
  const layerRef = useRef<any>(null);
  const objectUrlRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const logPrefix = `[FWI DEBUG][${debugLabel}]`;
  const serializedPoints = useMemo(
    () =>
      points
        .map((point) => `${point.id}:${point.lat.toFixed(4)}:${point.lng.toFixed(4)}:${valueAccessor(point).toFixed(4)}`)
        .join('|'),
    [points, valueAccessor]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const cleanupLayer = () => {
      const existingLayer = layerRef.current;
      if (existingLayer) {
        console.info(logPrefix, 'cleanupLayer()', { hadMapLayer: map.hasLayer(existingLayer) });
        if (map.hasLayer(existingLayer)) {
          map.removeLayer(existingLayer);
        } else {
          existingLayer.remove?.();
        }
        layerRef.current = null;
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };

    if (!visible || points.length === 0) {
      console.info(logPrefix, 'skipping render', {
        visible,
        pointsLength: points.length,
      });
      cleanupLayer();
      return () => {
        cleanupLayer();
      };
    }

    let cancelled = false;

    const createRasterLayer = async () => {
      cleanupLayer();

      const values = points.map((point) => valueAccessor(point));
      console.info(logPrefix, 'createRasterLayer()', {
        visible,
        pointsLength: points.length,
        valueMin: Math.min(...values),
        valueMax: Math.max(...values),
        displayMin,
        displayMax,
        colorScaleName,
        influenceRadius,
        rasterBounds,
        mapSize: map.getSize(),
      });

      const rasterStartedAt = performance.now();
      const raster = createFwiRasterSurface(points, valueAccessor, influenceRadius, rasterBounds, rasterMask, cellValueTransform);
      // The underlying indices may legitimately exceed the legend maximum
      // (especially in test mode). Persist display-ready pixels in the GeoTIFF
      // so validation and the renderer agree on the declared colour range.
      for (let index = 0; index < raster.data.length; index += 1) {
        if (raster.data[index] !== FWI_NO_DATA_VALUE) {
          raster.data[index] = Math.min(displayMax, Math.max(displayMin, raster.data[index]));
        }
      }
      const rasterValidation = validateGeneratedRaster(
        raster.data,
        FWI_NO_DATA_VALUE,
        raster,
        [displayMin, displayMax],
      );
      if (!rasterValidation.valid) {
        throw new Error(`Generated raster validation failed: ${rasterValidation.errors.join(' ')}`);
      }
      const validRasterValues = Array.from(raster.data).filter((value) => value !== FWI_NO_DATA_VALUE);
      console.info(logPrefix, 'raster surface ready', {
        bounds: {
          west: raster.west,
          east: raster.east,
          south: raster.south,
          north: raster.north,
        },
        validCellCount: validRasterValues.length,
        rasterMin: validRasterValues.length ? Math.min(...validRasterValues) : null,
        rasterMax: validRasterValues.length ? Math.max(...validRasterValues) : null,
        grid: `${raster.width}x${raster.height}`,
        generationMs: Math.round(performance.now() - rasterStartedAt),
      });

      const pixelWidth = (raster.east - raster.west) / FWI_RASTER_WIDTH;
      const pixelHeight = (raster.north - raster.south) / FWI_RASTER_HEIGHT;
      const arrayBuffer = await writeArrayBuffer(raster.data, {
        GeographicTypeGeoKey: 4326,
        GDAL_NODATA: String(FWI_NO_DATA_VALUE),
        height: FWI_RASTER_HEIGHT,
        width: FWI_RASTER_WIDTH,
        ModelPixelScale: [pixelWidth, pixelHeight, 0],
        ModelTiepoint: [0, 0, 0, raster.west, raster.north, 0],
      });

      if (cancelled || !mountedRef.current) {
        return;
      }

      const objectUrl = URL.createObjectURL(new Blob([arrayBuffer], { type: 'image/tiff' }));
      objectUrlRef.current = objectUrl;

      const leafletWithRaster = L as typeof L & {
        leafletGeotiff: (url: string, options: Record<string, unknown>) => any;
        LeafletGeotiff: {
          plotty: (options: Record<string, unknown>) => unknown;
        };
      };

      const layer = leafletWithRaster.leafletGeotiff(objectUrl, {
        bounds: [
          [raster.south, raster.west],
          [raster.north, raster.east],
        ],
        opacity,
        pane,
        // The raster is visual context. It must never consume map clicks used
        // by the FWI point picker or incident-report workflow.
        interactive: false,
        renderer: leafletWithRaster.LeafletGeotiff.plotty({
          clampLow: true,
          clampHigh: true,
          colorScale: colorScaleName,
          displayMin,
          displayMax,
        }),
      });

      // leaflet-geotiff defaults to nearest-neighbour screen sampling. Keep
      // the numerical raster unchanged while presenting it as a smooth field.
      layer.transform = smoothRasterTransform;

      layer.addTo(map);
      layerRef.current = layer;
      console.info(logPrefix, 'layer added to map', {
        objectUrl,
        mapHasLayer: map.hasLayer(layer),
      });
    };

    createRasterLayer().catch((error) => {
      console.error(logPrefix, 'Failed to create FWI GeoTIFF layer.', error);
      cleanupLayer();
    });

    return () => {
      cancelled = true;
      cleanupLayer();
    };
  }, [
    colorScaleName,
    cellValueTransform,
    displayMax,
    displayMin,
    influenceRadius,
    map,
    opacity,
    pane,
    points,
    rasterBounds,
    rasterMask,
    serializedPoints,
    valueAccessor,
    visible,
  ]);

  return null;
};
