import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import { WMSTileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { MapLayer } from '../../../types';
import {
  FOREST_RASTER_LAYERS,
  FOREST_RASTER_MANIFEST_URL,
  FOREST_WMS_URL,
  metadataForLayer,
} from '../../../lib/gis/forestRasterLayers';
import {
  WEB_MAP_CRS,
  validateRasterMetadata,
  validateWmsRasterMetadata,
  validateWmsCapabilities,
  type RasterMetadata,
} from '../../../lib/gis/rasterValidation';
import { bihBorderData } from '../../../bihData';

interface Props {
  layerId: MapLayer;
  visible: boolean;
  pane?: string;
}

const requestCache = new Map<string, Promise<string>>();

const BIH_POLYGONS = (bihBorderData.features as Array<{ geometry?: { type?: string; coordinates?: number[][][] } }>)
  .filter((feature) => feature.geometry?.type === 'Polygon')
  .map((feature) => feature.geometry!.coordinates!);

interface ClippedWmsProps {
  url: string;
  layerName: string;
  overviewLayerName?: string;
  opacity: number;
  pane?: string;
  attribution: string;
}

/** Draw each WMS tile in a canvas clipped to the authoritative BiH boundary.
 * The remote WMS remains categorical; this only hides pixels outside BiH. */
const BiHClippedWmsLayer: React.FC<ClippedWmsProps> = ({ url, layerName, overviewLayerName, opacity, pane, attribution }) => {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  // The public 20 m WMS intentionally has no country-scale output. Its 100 m
  // companion preserves the same classes and is appropriate for overview maps.
  const renderedLayerName = overviewLayerName && zoom < 10 ? overviewLayerName : layerName;

  useEffect(() => {
    const ClippedWms = L.TileLayer.WMS.extend({
      createTile(coords: L.Coords, done: L.DoneCallback) {
        const size = this.getTileSize();
        const canvas = document.createElement('canvas');
        canvas.width = size.x;
        canvas.height = size.y;
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
          const context = canvas.getContext('2d');
          if (!context) return done(new Error('Unable to create raster tile canvas.'), canvas);
          const tileOrigin = L.point(coords.x * size.x, coords.y * size.y);
          context.save();
          context.beginPath();
          BIH_POLYGONS.forEach((polygon) => polygon.forEach((ring) => {
            ring.forEach(([lng, lat], index) => {
              const point = map.project(L.latLng(lat, lng), coords.z).subtract(tileOrigin);
              if (index === 0) context.moveTo(point.x, point.y);
              else context.lineTo(point.x, point.y);
            });
            context.closePath();
          }));
          context.clip();
          context.drawImage(image, 0, 0, size.x, size.y);
          context.restore();
          done(null, canvas);
        };
        image.onerror = () => done(new Error('Forest-type WMS tile could not be loaded.'), canvas);
        image.src = this.getTileUrl(coords);
        return canvas;
      },
    });

    const layer = new ClippedWms(url, {
      layers: renderedLayerName,
      format: 'image/png',
      transparent: true,
      version: '1.3.0',
      crs: L.CRS.EPSG3857,
      bounds: [[42.5, 15.7], [45.4, 19.7]],
      opacity,
      attribution,
      pane,
      updateWhenIdle: true,
      updateWhenZooming: false,
      keepBuffer: 1,
      crossOrigin: 'anonymous',
    });
    layer.addTo(map);
    return () => { layer.remove(); };
  }, [attribution, map, opacity, pane, renderedLayerName, url]);

  return null;
};

function getText(url: string): Promise<string> {
  let request = requestCache.get(url);
  if (!request) {
    request = fetch(url, { headers: { Accept: 'application/xml,text/xml,*/*' } }).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    });
    requestCache.set(url, request);
  }
  return request;
}

function capabilitiesUrl(serviceUrl: string) {
  const url = new URL(serviceUrl, window.location.href);
  url.searchParams.set('service', 'WMS');
  url.searchParams.set('request', 'GetCapabilities');
  url.searchParams.set('version', '1.3.0');
  return url.toString();
}

async function getManifest(url: string): Promise<RasterMetadata[]> {
  const raw = await getText(url);
  const parsed = JSON.parse(raw) as RasterMetadata[] | { layers: RasterMetadata[] };
  const layers = Array.isArray(parsed) ? parsed : parsed.layers;
  if (!Array.isArray(layers)) throw new Error('Raster manifest has no layers array.');
  return layers;
}

export const ValidatedForestWmsLayer: React.FC<Props> = ({ layerId, visible, pane }) => {
  const [ready, setReady] = useState(false);
  const definition = FOREST_RASTER_LAYERS.find((layer) => layer.id === layerId);
  const serviceUrl = definition?.wmsUrl || FOREST_WMS_URL;

  useEffect(() => {
    setReady(false);
    if (!visible || !definition) return;

    if (!serviceUrl || !definition.wmsLayerName) {
      console.warn(`[Forest raster][${layerId}] Layer is not configured; no WMS request was sent.`);
      return;
    }

    let cancelled = false;
    const validation = definition.wmsMetadata
      ? Promise.resolve([validateWmsRasterMetadata(definition.wmsMetadata, definition.contract)])
      : getManifest(FOREST_RASTER_MANIFEST_URL).then((manifest) => {
        const metadata = metadataForLayer(manifest, layerId);
        if (!metadata) throw new Error('Layer is absent from the verified raster manifest.');
        return [validateRasterMetadata(metadata, definition.contract)];
      });

    Promise.all([validation, getText(capabilitiesUrl(serviceUrl))]).then(([rasterResults, capabilities]) => {
      const wmsValidation = validateWmsCapabilities(capabilities, definition.wmsLayerName, WEB_MAP_CRS);
      const overviewValidation = definition.overviewWmsLayerName
        ? validateWmsCapabilities(capabilities, definition.overviewWmsLayerName, WEB_MAP_CRS)
        : { errors: [] };
      const errors = [...rasterResults.flatMap((result) => result.errors), ...wmsValidation.errors, ...overviewValidation.errors];
      if (errors.length > 0) throw new Error(errors.join(' '));

      if (!cancelled) setReady(true);
    }).catch((error) => {
      if (!cancelled) {
        setReady(false);
        console.error(`[Forest raster][${layerId}] Rendering blocked by validation.`, error);
      }
    });

    return () => { cancelled = true; };
  }, [definition, layerId, serviceUrl, visible]);

  if (!visible || !ready || !definition || !serviceUrl || !definition.wmsLayerName) return null;

  if (definition.dataType === 'forest_type') {
    return <BiHClippedWmsLayer url={serviceUrl} layerName={definition.wmsLayerName} overviewLayerName={definition.overviewWmsLayerName} opacity={definition.opacity} attribution={definition.attribution} pane={pane} />;
  }

  return (
    <WMSTileLayer
      url={serviceUrl}
      layers={definition.wmsLayerName}
      format="image/png"
      transparent
      version="1.3.0"
      crs={L.CRS.EPSG3857}
      bounds={[[42.5, 15.7], [45.4, 19.7]]}
      opacity={definition.opacity}
      minZoom={definition.minRenderZoom}
      maxZoom={definition.maxRenderZoom}
      attribution={definition.attribution}
      pane={pane}
      updateWhenIdle
      updateWhenZooming={false}
      keepBuffer={1}
    />
  );
};
