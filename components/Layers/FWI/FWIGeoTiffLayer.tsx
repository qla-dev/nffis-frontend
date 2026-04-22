import React, { useEffect, useMemo, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { writeArrayBuffer } from 'geotiff';
import '@qartlabs/leaflet-geotiff';
import '@qartlabs/leaflet-geotiff/leaflet-geotiff-plotty.js';

export interface FwiRasterPoint {
  id: string;
  lat: number;
  lng: number;
}

interface FWIGeoTiffLayerProps<TPoint extends FwiRasterPoint> {
  points: TPoint[];
  visible: boolean;
  valueAccessor: (point: TPoint) => number;
  displayMin: number;
  displayMax: number;
  colorScaleName: string;
  rasterBounds?: {
    west: number;
    east: number;
    south: number;
    north: number;
  };
  debugLabel?: string;
  opacity?: number;
  influenceRadius?: number;
  pane?: string;
}

const NO_DATA_VALUE = -9999;
const GRID_WIDTH = 160;
const GRID_HEIGHT = 160;
const DEFAULT_PADDING = 0.3;

const createRasterSurface = <TPoint extends FwiRasterPoint>(
  points: TPoint[],
  valueAccessor: (point: TPoint) => number,
  influenceRadius: number,
  rasterBounds?: {
    west: number;
    east: number;
    south: number;
    north: number;
  }
) => {
  const latitudes = points.map((point) => point.lat);
  const longitudes = points.map((point) => point.lng);
  const west = rasterBounds?.west ?? (Math.min(...longitudes) - DEFAULT_PADDING);
  const east = rasterBounds?.east ?? (Math.max(...longitudes) + DEFAULT_PADDING);
  const south = rasterBounds?.south ?? (Math.min(...latitudes) - DEFAULT_PADDING);
  const north = rasterBounds?.north ?? (Math.max(...latitudes) + DEFAULT_PADDING);
  const latSpan = north - south;
  const lngSpan = east - west;
  const data = new Float32Array(GRID_WIDTH * GRID_HEIGHT);

  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    const lat = north - ((y + 0.5) / GRID_HEIGHT) * latSpan;
    const cosLat = Math.cos((lat * Math.PI) / 180);

    for (let x = 0; x < GRID_WIDTH; x += 1) {
      const lng = west + ((x + 0.5) / GRID_WIDTH) * lngSpan;
      let weightedValue = 0;
      let totalWeight = 0;

      for (const point of points) {
        const dx = (lng - point.lng) * cosLat;
        const dy = lat - point.lat;
        const distanceSquared = (dx * dx) + (dy * dy);
        const weight = Math.exp(-distanceSquared / (2 * influenceRadius * influenceRadius));

        weightedValue += valueAccessor(point) * weight;
        totalWeight += weight;
      }

      data[(y * GRID_WIDTH) + x] = totalWeight > 0 ? weightedValue / totalWeight : NO_DATA_VALUE;
    }
  }

  return { data, west, east, south, north };
};

export const FWIGeoTiffLayer = <TPoint extends FwiRasterPoint>({
  points,
  visible,
  valueAccessor,
  displayMin,
  displayMax,
  colorScaleName,
  rasterBounds,
  debugLabel = colorScaleName,
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

      const raster = createRasterSurface(points, valueAccessor, influenceRadius, rasterBounds);
      const validRasterValues = Array.from(raster.data).filter((value) => value !== NO_DATA_VALUE);
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
      });

      const pixelWidth = (raster.east - raster.west) / GRID_WIDTH;
      const pixelHeight = (raster.north - raster.south) / GRID_HEIGHT;
      const arrayBuffer = await writeArrayBuffer(raster.data, {
        GeographicTypeGeoKey: 4326,
        height: GRID_HEIGHT,
        width: GRID_WIDTH,
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
        renderer: leafletWithRaster.LeafletGeotiff.plotty({
          clampLow: true,
          clampHigh: true,
          colorScale: colorScaleName,
          displayMin,
          displayMax,
        }),
      });

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
    displayMax,
    displayMin,
    influenceRadius,
    map,
    opacity,
    pane,
    points,
    rasterBounds,
    serializedPoints,
    valueAccessor,
    visible,
  ]);

  return null;
};
