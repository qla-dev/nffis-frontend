
import React, { lazy, Suspense, useState, useCallback, useEffect, useRef } from 'react';
import { Navigation } from './components/Navigation';
import { ReportModal } from './components/Report/ReportModal';
import { SessionLoginGate } from './components/Auth/SessionLoginGate';
import { Language, AppState, MapLayer, IncidentReport, IncidentType } from './types';
import { INITIAL_INCIDENTS, TRANSLATIONS } from './constants';
import { Waves, Flame, Database } from 'lucide-react';
import type { DatasetLayer, DatasetLayerFilterState, DatasetLayerStyle } from './services/datasetService';
import { bulkSaveDatasetFeatureGeometries, createDatasetPolygon, fetchDatasetLayerFeature, fetchDatasetLayers, saveActiveDatasetLayerIds, saveDatasetLayerStyle, updateDatasetFeatureAttributes } from './services/datasetService';
import { createIncidentReport, type CreateReportPayload } from './services/reportStatisticsService';
import type { EditLayerSidebarTabId } from './components/Layers/EditLayerSidebar/EditLayerSidebar';
import {
  currentUser as fetchCurrentUser,
  canUploadAws,
  hasPermission,
  logout as logoutSession,
  type AuthUser,
} from './lib/auth/session';
import { changedFeatures, cloneFeatures, closeRing, type GeoEditorMode, type Position } from './lib/gis/geoEditor';
import { selectMapRenderer } from './lib/gis/mapRendererPoc';

const mapEnvironment = (import.meta as ImportMeta & { env: Record<string, string | boolean | undefined> }).env;
const selectedMapRenderer = selectMapRenderer(window.location.search, {
  enabled: mapEnvironment.DEV === true || mapEnvironment.VITE_ENABLE_MAPLIBRE_POC === 'true',
  mapboxEnabled: mapEnvironment.DEV === true || mapEnvironment.VITE_ENABLE_MAPBOX_POC === 'true',
  defaultRenderer: String(mapEnvironment.VITE_MAP_RENDERER_DEFAULT || 'leaflet'),
});
const GISMap = lazy(() => {
  if (selectedMapRenderer === 'maplibre') {
    return import('./components/Map/MapLibreGISMap').then(module => ({ default: module.MapLibreGISMap }));
  }
  if (selectedMapRenderer === 'mapbox') {
    return import('./components/Map/MapboxGISMap').then(module => ({ default: module.MapboxGISMap }));
  }
  return import('./components/Map/GISMap').then(module => ({ default: module.GISMap }));
});
const DatasetLayerOverlay = lazy(() => import('./components/Layers/DatasetLayerOverlay').then(module => ({ default: module.DatasetLayerOverlay })));
const StatisticsDashboard = lazy(() => import('./components/Statistics/StatisticsDashboard'));
const FireMonitoringDashboard = lazy(() => import('./components/FireMonitoring/OperationalFireDashboard'));

const BASE_LAYER_IDS = [
  MapLayer.SATELLITE,
  MapLayer.SATELLITE_CLARITY,
  MapLayer.SATELLITE_GOOGLE,
  MapLayer.SENTINEL,
  MapLayer.INFRARED,
  MapLayer.NASA_FIRMS,
  MapLayer.THERMAL,
  MapLayer.TERRAIN,
  MapLayer.WINDY
];

const FWI_LAYER_IDS = [
  MapLayer.FWI_BOSNIAN,
  MapLayer.FIRE_INTELLIGENCE_FWI,
];

const FWI_DEBUG_PREFIX = '[FWI DEBUG]';
const IS_EXTREME_FWI_TEST_ROUTE = new URLSearchParams(window.location.search).get('fwiTest') === 'extreme';

const App: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [state, setState] = useState<AppState>({
    language: Language.EN,
    // Enable only the operational overlays that are intended to be on at startup.
    activeLayers: new Set([
      MapLayer.FIRE_RISK, 
      MapLayer.FORESTS, 
      MapLayer.LANDFILLS,
      MapLayer.FWI_BOSNIAN,
      ...(IS_EXTREME_FWI_TEST_ROUTE ? [MapLayer.FWI_FIRE_SPREAD] : []),
      MapLayer.ACTIVE_FIRES,
      'AWS Precipitation' as MapLayer,
      'AWS Agro' as MapLayer,
      'AWS Meteo' as MapLayer
    ]),
    incidents: INITIAL_INCIDENTS as any,
    view: 'map',
    isReporting: false,
    isDarkMode: false,
  });

  const [reportLocation, setReportLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isDatasetLayerPanelOpen, setIsDatasetLayerPanelOpen] = useState(false);
  const [isDatasetFilterPanelOpen, setIsDatasetFilterPanelOpen] = useState(false);
  const [selectedDatasetFeature, setSelectedDatasetFeature] = useState<GeoJSON.Feature | null>(null);
  const [datasetEditorInitialTab, setDatasetEditorInitialTab] = useState<EditLayerSidebarTabId>('filters');
  const [isSavingDatasetFeature, setIsSavingDatasetFeature] = useState(false);
  const [datasetFeatureSaveError, setDatasetFeatureSaveError] = useState<string | null>(null);
  const [datasetLayerRefreshKey, setDatasetLayerRefreshKey] = useState(0);
  const [datasetLayers, setDatasetLayers] = useState<DatasetLayer[]>([]);
  const [datasetLayersLoading, setDatasetLayersLoading] = useState(false);
  const [datasetLayersError, setDatasetLayersError] = useState<string | null>(null);
  const [activeDatasetLayerIds, setActiveDatasetLayerIds] = useState<Set<number>>(new Set());
  const [loadingDatasetLayerIds, setLoadingDatasetLayerIds] = useState<Set<number>>(new Set());
  const [selectedDatasetLayerId, setSelectedDatasetLayerId] = useState<number | null>(null);
  const [datasetLayerFilters, setDatasetLayerFilters] = useState<Record<number, DatasetLayerFilterState>>({});
  const [loadedDatasetFeatures, setLoadedDatasetFeatures] = useState<Record<number, GeoJSON.FeatureCollection | null>>({});
  const [geoEditorMode, setGeoEditorMode] = useState<GeoEditorMode>('view');
  const [geoEditorOriginalFeatures, setGeoEditorOriginalFeatures] = useState<GeoJSON.Feature[]>([]);
  const [geoEditorFeatures, setGeoEditorFeatures] = useState<GeoJSON.Feature[]>([]);
  const [geoEditorDrawing, setGeoEditorDrawing] = useState<Position[]>([]);
  const [geoEditorSnappingEnabled, setGeoEditorSnappingEnabled] = useState(true);
  const [geoEditorSelectedFeatureId, setGeoEditorSelectedFeatureId] = useState<string | null>(null);
  const [geoEditorNewPolygonName, setGeoEditorNewPolygonName] = useState('');
  const [isSavingGeometry, setIsSavingGeometry] = useState(false);
  const [geometrySaveError, setGeometrySaveError] = useState<string | null>(null);
  const geoEditorLayerIdRef = useRef<number | null>(null);
  const appliedDefaultDatasetLayersRef = useRef(false);

  const t = TRANSLATIONS[state.language];
  const canViewReports = hasPermission(authUser, 'reports', 'view');
  const canCreateReports = hasPermission(authUser, 'reports', 'create');
  const canViewDatasetLayers = hasPermission(authUser, 'dataset-layers', 'view');
  const canUpdateDatasetLayers = hasPermission(authUser, 'dataset-layers', 'update');
  const canCreateDatasetLayers = hasPermission(authUser, 'dataset-layers', 'create');
  const canManageLayerRoleAccess = hasPermission(authUser, 'layer-visibility', 'update');
  const isSuperAdmin = authUser?.role?.slug === 'super-admin';
  const canViewMapLayers = hasPermission(authUser, 'map-layers', 'view');
  const canViewFwi = hasPermission(authUser, 'fire-weather-indices', 'view');
  const canViewFireMonitoring = hasPermission(authUser, 'fire-monitoring', 'view');
  const canManageFireMonitoring = hasPermission(authUser, 'fire-monitoring', 'update');
  const canViewFireIntelligence = hasPermission(authUser, 'fire-intelligence', 'view');
  const canRunFireIntelligence = hasPermission(authUser, 'fire-intelligence', 'create');
  const canReviewFireIntelligence = hasPermission(authUser, 'fire-intelligence', 'update');
  const canViewAws = hasPermission(authUser, 'aws-monitoring', 'view');
  const hasEntityScope = hasPermission(authUser, 'fbih', 'view') || hasPermission(authUser, 'rs', 'view');
  const canViewFbih = !hasEntityScope || hasPermission(authUser, 'fbih', 'view');
  const canViewRs = !hasEntityScope || hasPermission(authUser, 'rs', 'view');
  const canAdjustAws = canUploadAws(authUser);

  useEffect(() => {
    let mounted = true;

    fetchCurrentUser()
      .then((user) => {
        if (mounted) setAuthUser(user);
      })
      .catch(() => {
        if (mounted) setAuthUser(null);
      })
      .finally(() => {
        if (mounted) setIsCheckingSession(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSetView = (view: AppState['view']) => {
    if ((view === 'reports' || view === 'stats') && !canViewReports) return;
    if (view === 'fires' && !canViewFireMonitoring) return;
    if (view === 'layers' && !canViewDatasetLayers) return;

    setIsDatasetLayerPanelOpen(false);
    setIsDatasetFilterPanelOpen(false);
    setSelectedDatasetFeature(null);
    setDatasetFeatureSaveError(null);
    setState(prev => ({ ...prev, view }));
  };
  const handleSetLang = (language: Language) => setState(prev => ({ ...prev, language }));
  const handleToggleTheme = () => setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));

  useEffect(() => {
    if (!authUser || !canViewDatasetLayers) {
      setDatasetLayers([]);
      setDatasetLayersLoading(false);
      return;
    }

    let isMounted = true;
    setDatasetLayersLoading(true);

    fetchDatasetLayers()
      .then((layers) => {
        if (!isMounted) return;
        setDatasetLayers(layers);
        setDatasetLayersError(null);

        if (!appliedDefaultDatasetLayersRef.current) {
          const permitted = new Set(layers.map((layer) => layer.id));
          const saved = authUser.active_dataset_layer_ids;
          const preferredIds = Array.isArray(saved)
            ? saved
            : layers.filter((layer) => layer.visible_by_default).map((layer) => layer.id);
          const defaults = preferredIds.filter((id) => permitted.has(id));
          setActiveDatasetLayerIds(new Set(defaults));
          setSelectedDatasetLayerId(defaults[0] ?? layers[0]?.id ?? null);
          appliedDefaultDatasetLayersRef.current = true;
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setDatasetLayersError('Dataset catalog unavailable.');
      })
      .finally(() => {
        if (isMounted) {
          setDatasetLayersLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [authUser?.id, canViewDatasetLayers]);
  
  const startReporting = () => {
    if (!canCreateReports) return;

    setShowModal(false);
    setReportLocation(null);
    // Reporting owns the screen: drop any open GIS sidebar so nothing overlaps the map picker.
    setIsDatasetLayerPanelOpen(false);
    setIsDatasetFilterPanelOpen(false);
    setSelectedDatasetFeature(null);
    setDatasetFeatureSaveError(null);
    setState(prev => ({ ...prev, view: 'map', isReporting: true }));
  };
  
  const cancelReporting = () => {
    setReportLocation(null);
    setState(prev => ({ ...prev, isReporting: false }));
  };

  const toggleDatasetLayersPanel = useCallback(() => {
    if (!canViewDatasetLayers) return;

    setState(prev => ({ ...prev, view: 'map', isReporting: false }));
    setIsDatasetLayerPanelOpen((isOpen) => {
      if (isOpen) {
        setIsDatasetFilterPanelOpen(false);
        setSelectedDatasetFeature(null);
        setDatasetFeatureSaveError(null);
      }

      return !isOpen;
    });
  }, [canViewDatasetLayers]);

  const closeDatasetLayersPanel = useCallback(() => {
    setIsDatasetLayerPanelOpen(false);
    setIsDatasetFilterPanelOpen(false);
    setSelectedDatasetFeature(null);
    setDatasetFeatureSaveError(null);
  }, []);

  const openDatasetFilterForLayer = useCallback((layerId: number, feature?: GeoJSON.Feature) => {
    if (!canViewDatasetLayers) return;

    setSelectedDatasetLayerId(layerId);
    setSelectedDatasetFeature(feature || null);
    const featureId = feature?.id ?? (feature?.properties as Record<string, unknown> | undefined)?.id;
    if (geoEditorMode === 'edit-single' && featureId !== undefined && featureId !== null) {
      setGeoEditorSelectedFeatureId(String(featureId));
      setDatasetEditorInitialTab('geoeditor');
    } else {
      setDatasetEditorInitialTab(feature && canUpdateDatasetLayers ? 'attributes' : feature ? 'information' : 'filters');
    }
    setDatasetFeatureSaveError(null);
    setIsDatasetLayerPanelOpen(true);
    setIsDatasetFilterPanelOpen(true);

    // Vector tiles carry lightweight display data. Resolve the authoritative
    // feature before showing attributes or beginning a single-feature edit.
    if (featureId !== undefined && featureId !== null && feature?.geometry == null) {
      void fetchDatasetLayerFeature(layerId, featureId)
        .then((fullFeature) => {
          setSelectedDatasetFeature((current) => {
            const currentId = current?.id ?? current?.properties?.id;
            return String(currentId) === String(featureId) ? fullFeature : current;
          });
        })
        .catch(() => setDatasetFeatureSaveError('Unable to load feature details.'));
    }
  }, [canUpdateDatasetLayers, canViewDatasetLayers, geoEditorMode]);

  const selectDatasetLayer = useCallback((layerId: number) => {
    const selectedLayer = datasetLayers.find((layer) => layer.id === layerId);
    setSelectedDatasetLayerId(layerId);
    setSelectedDatasetFeature(null);
    setDatasetEditorInitialTab(selectedLayer?.layer_kind === 'raster' ? 'information' : 'filters');
    setDatasetFeatureSaveError(null);
    setGeoEditorMode('view');
    setGeoEditorDrawing([]);
    setGeoEditorSelectedFeatureId(null);
    setGeoEditorOriginalFeatures([]);
    setGeoEditorFeatures([]);
    geoEditorLayerIdRef.current = null;
    setIsDatasetFilterPanelOpen(true);
  }, []);

  // Name/category/subcategory are edited in the Information tab; fold the saved
  // layer back into the catalog so the list and headers pick it up immediately.
  const handleDatasetLayerUpdated = useCallback((updated: DatasetLayer) => {
    setDatasetLayers(prev => prev.map(layer => (
      layer.id === updated.id ? { ...layer, ...updated } : layer
    )));
  }, []);

  const invalidateDatasetLayerTiles = useCallback((layerId: number) => {
    setDatasetLayers((previous) => previous.map((layer) => (
      layer.id === layerId ? { ...layer, tile_version: String(Date.now()) } : layer
    )));
  }, []);

  const updateDatasetLayerStyle = useCallback((layerId: number, style: DatasetLayerStyle) => {
    setDatasetLayers(prev => prev.map(layer => (
      layer.id === layerId
        ? { ...layer, style: { ...layer.style, ...style } }
        : layer
    )));
  }, []);

  const persistDatasetLayerStyle = useCallback(async (layerId: number, style: DatasetLayerStyle) => {
    if (!canUpdateDatasetLayers) return;

    const updatedLayer = await saveDatasetLayerStyle(layerId, style);
    setDatasetLayers(prev => prev.map(layer => (
      layer.id === layerId ? updatedLayer : layer
    )));
  }, [canUpdateDatasetLayers]);

  const saveDatasetFeatureAttributes = useCallback(async (attributes: Record<string, unknown>) => {
    if (!canUpdateDatasetLayers) {
      setDatasetFeatureSaveError('Your role cannot update dataset layers.');
      return;
    }

    const featureId = selectedDatasetFeature?.id ?? (selectedDatasetFeature?.properties as Record<string, unknown> | undefined)?.id;

    if (!selectedDatasetLayerId || featureId === undefined || featureId === null) {
      setDatasetFeatureSaveError('No editable feature is selected.');
      return;
    }

    setIsSavingDatasetFeature(true);
    setDatasetFeatureSaveError(null);

    try {
      const updatedFeature = await updateDatasetFeatureAttributes(selectedDatasetLayerId, featureId, attributes);
      setSelectedDatasetFeature(updatedFeature);
      invalidateDatasetLayerTiles(selectedDatasetLayerId);
      setDatasetLayerRefreshKey(prev => prev + 1);
    } catch {
      setDatasetFeatureSaveError('Unable to save attributes.');
    } finally {
      setIsSavingDatasetFeature(false);
    }
  }, [canUpdateDatasetLayers, invalidateDatasetLayerTiles, selectedDatasetFeature, selectedDatasetLayerId]);

  const handleLogout = useCallback(async () => {
    try {
      await logoutSession();
    } finally {
      setAuthUser(null);
      setDatasetLayers([]);
      setActiveDatasetLayerIds(new Set());
      setIsDatasetLayerPanelOpen(false);
      setIsDatasetFilterPanelOpen(false);
      setState((previous) => ({ ...previous, view: 'map', isReporting: false }));
      appliedDefaultDatasetLayersRef.current = false;
    }
  }, []);

  const toggleLayer = useCallback((layer: MapLayer) => {
    if (!layer) return;
    setState(prev => {
      const newLayers = new Set(prev.activeLayers);

      if (FWI_LAYER_IDS.includes(layer)) {
        const isAlreadyActive = newLayers.has(layer);
        FWI_LAYER_IDS.forEach(id => newLayers.delete(id));
        if (!isAlreadyActive) {
          newLayers.add(layer);
        } else {
          newLayers.delete(MapLayer.FWI_FIRE_SPREAD);
        }
        return { ...prev, activeLayers: newLayers };
      }

      if (layer === MapLayer.FWI_FIRE_SPREAD) {
        if (newLayers.has(layer)) {
          newLayers.delete(layer);
        } else {
          newLayers.add(MapLayer.FWI_BOSNIAN);
          newLayers.add(layer);
        }
        return { ...prev, activeLayers: newLayers };
      }

      if (newLayers.has(layer)) {
        newLayers.delete(layer);
      } else {
        newLayers.add(layer);
      }
      return { ...prev, activeLayers: new Set(newLayers) };
    });
  }, []);

  const setBaseLayer = useCallback((layer: MapLayer | null) => {
    setState(prev => {
      const newLayers = new Set(prev.activeLayers);
      BASE_LAYER_IDS.forEach(id => newLayers.delete(id));
      if (layer) {
        newLayers.add(layer);
      }
      return { ...prev, activeLayers: newLayers };
    });
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setReportLocation({ lat, lng });
    setShowModal(true);
    setState(prev => ({ ...prev, isReporting: false }));
  }, []);

  const handleReportSubmit = async (data: CreateReportPayload & { type: IncidentType; urgency: IncidentReport['urgency'] }) => {
    const { type, urgency, ...payload } = data;
    const createdReport = await createIncidentReport(payload);
    const newIncident: IncidentReport = {
      id: String(createdReport.id),
      type,
      lat: data.latitude,
      lng: data.longitude,
      description: data.description,
      urgency,
      timestamp: new Date(createdReport.reported_at).getTime(),
      windDirection: createdReport.wind_direction_degrees,
      windSpeed: createdReport.wind_speed_kmh,
    };
    setState(prev => ({ ...prev, incidents: [newIncident, ...prev.incidents] }));
    setShowModal(false);
    setReportLocation(null);
  };

  const toggleDatasetLayer = useCallback((layerId: number) => {
    if (loadingDatasetLayerIds.has(layerId)) return;
    const isActive = activeDatasetLayerIds.has(layerId);

    setActiveDatasetLayerIds(prev => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      void saveActiveDatasetLayerIds(Array.from(next)).catch(() => undefined);
      return next;
    });
    setLoadingDatasetLayerIds(previous => {
      const next = new Set(previous);
      if (isActive) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
    setSelectedDatasetLayerId(layerId);
  }, [activeDatasetLayerIds, loadingDatasetLayerIds]);

  const setCategoryDatasetLayersActive = useCallback((layerIds: number[], active: boolean) => {
    const idsToChange = layerIds.filter((layerId) => (
      !loadingDatasetLayerIds.has(layerId)
      && (active ? !activeDatasetLayerIds.has(layerId) : activeDatasetLayerIds.has(layerId))
    ));

    if (idsToChange.length === 0) return;

    setActiveDatasetLayerIds((previous) => {
      const next = new Set(previous);
      idsToChange.forEach((layerId) => active ? next.add(layerId) : next.delete(layerId));
      void saveActiveDatasetLayerIds(Array.from(next)).catch(() => undefined);
      return next;
    });

    setLoadingDatasetLayerIds((previous) => {
      const next = new Set(previous);
      idsToChange.forEach((layerId) => active ? next.add(layerId) : next.delete(layerId));
      return next;
    });
  }, [activeDatasetLayerIds, loadingDatasetLayerIds]);

  const handleDatasetLayerLoadingChange = useCallback((layerId: number, isLoading: boolean) => {
    setLoadingDatasetLayerIds(previous => {
      const next = new Set(previous);
      if (isLoading) next.add(layerId);
      else next.delete(layerId);
      return next;
    });
  }, []);

  const updateDatasetLayerFilter = useCallback((
    layerId: number,
    update: DatasetLayerFilterState | ((current: DatasetLayerFilterState) => DatasetLayerFilterState),
  ) => {
    setDatasetLayerFilters((previous) => {
      const current = previous[layerId] || {};
      const filter = typeof update === 'function' ? update(current) : update;

      return {
        ...previous,
        [layerId]: filter,
      };
    });
  }, [datasetLayers]);

  const clearDatasetLayerFilter = useCallback((layerId: number) => {
    setDatasetLayerFilters(prev => {
      const next = { ...prev };
      delete next[layerId];
      return next;
    });
  }, []);

  const handleDatasetFeaturesLoaded = useCallback((layerId: number, collection: GeoJSON.FeatureCollection | null) => {
    setLoadedDatasetFeatures((previous) => ({ ...previous, [layerId]: collection }));
    if (layerId !== selectedDatasetLayerId || !collection || geoEditorLayerIdRef.current === layerId) return;
    const features = cloneFeatures(collection.features);
    setGeoEditorOriginalFeatures(features);
    setGeoEditorFeatures(cloneFeatures(features));
    geoEditorLayerIdRef.current = layerId;
  }, [selectedDatasetLayerId]);

  const handleDatasetEditorFeaturesLoaded = useCallback((layerId: number, collection: GeoJSON.FeatureCollection) => {
    if (layerId !== selectedDatasetLayerId) return;
    const features = cloneFeatures(collection.features);
    setGeoEditorOriginalFeatures(features);
    setGeoEditorFeatures(cloneFeatures(features));
    geoEditorLayerIdRef.current = layerId;
  }, [selectedDatasetLayerId]);

  const geoEditorPendingChanges = changedFeatures(geoEditorOriginalFeatures, geoEditorFeatures).length;

  const handleGeoEditorModeChange = useCallback((mode: GeoEditorMode) => {
    const layer = datasetLayers.find((candidate) => candidate.id === selectedDatasetLayerId);
    if (!layer || layer.geometry_family !== 'polygon') {
      setGeometrySaveError('Select a polygon layer first.');
      return;
    }
    if (mode === 'draw' && !canCreateDatasetLayers) {
      setGeometrySaveError('Your role cannot create dataset polygons.');
      return;
    }
    if ((mode === 'edit-single' || mode === 'edit-shared') && !canUpdateDatasetLayers) {
      setGeometrySaveError('Your role cannot update dataset polygons.');
      return;
    }
    const loaded = loadedDatasetFeatures[layer.id];
    if (geoEditorLayerIdRef.current !== layer.id) {
      if (loaded) {
        const features = cloneFeatures(loaded.features);
        setGeoEditorOriginalFeatures(features);
        setGeoEditorFeatures(cloneFeatures(features));
        geoEditorLayerIdRef.current = layer.id;
      } else {
        setGeoEditorOriginalFeatures([]);
        setGeoEditorFeatures([]);
      }
    }
    setActiveDatasetLayerIds((previous) => new Set(previous).add(layer.id));
    setGeometrySaveError(null);
    setGeoEditorMode(mode);
  }, [canCreateDatasetLayers, canUpdateDatasetLayers, datasetLayers, loadedDatasetFeatures, selectedDatasetLayerId]);

  const finishGeoEditorDrawing = useCallback(() => {
    if (geoEditorDrawing.length < 3 || !geoEditorNewPolygonName.trim()) return;
    const temporaryId = `nffis-new-${Date.now()}`;
    const feature: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: 'Feature', id: temporaryId,
      properties: { id: temporaryId, name: geoEditorNewPolygonName.trim(), __nffis_new: true },
      geometry: { type: 'Polygon', coordinates: [closeRing(geoEditorDrawing)] },
    };
    setGeoEditorFeatures((previous) => [...previous, feature]);
    setGeoEditorDrawing([]);
    setGeoEditorNewPolygonName('');
    setGeoEditorMode('view');
  }, [geoEditorDrawing, geoEditorNewPolygonName]);

  const resetGeoEditor = useCallback(() => {
    setGeoEditorFeatures(cloneFeatures(geoEditorOriginalFeatures));
    setGeoEditorDrawing([]);
    setGeoEditorSelectedFeatureId(null);
    setGeometrySaveError(null);
    setGeoEditorMode('view');
  }, [geoEditorOriginalFeatures]);

  const saveGeoEditor = useCallback(async () => {
    if (!selectedDatasetLayerId) return;
    const changed = changedFeatures(geoEditorOriginalFeatures, geoEditorFeatures);
    const created = changed.filter((feature) => feature.properties?.__nffis_new === true);
    const updated = changed.filter((feature) => feature.properties?.__nffis_new !== true);
    setIsSavingGeometry(true);
    setGeometrySaveError(null);
    try {
      if (updated.length) {
        await bulkSaveDatasetFeatureGeometries(selectedDatasetLayerId, updated.map((feature) => ({ id: feature.id ?? feature.properties?.id as string | number, geometry: feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon })));
      }
      for (const feature of created) {
        await createDatasetPolygon(selectedDatasetLayerId, String(feature.properties?.name || 'Polygon'), feature.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon);
      }
      setGeoEditorMode('view');
      setGeoEditorDrawing([]);
      setGeoEditorSelectedFeatureId(null);
      setGeoEditorOriginalFeatures([]);
      setGeoEditorFeatures([]);
      geoEditorLayerIdRef.current = null;
      invalidateDatasetLayerTiles(selectedDatasetLayerId);
      setDatasetLayerRefreshKey((previous) => previous + 1);
    } catch (error) {
      setGeometrySaveError(error instanceof Error ? error.message : 'Unable to save polygon geometry.');
    } finally {
      setIsSavingGeometry(false);
    }
  }, [geoEditorFeatures, geoEditorOriginalFeatures, invalidateDatasetLayerTiles, selectedDatasetLayerId]);

  return (
    <div className={`flex h-screen w-full overflow-hidden ${state.isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {authUser && <Navigation
        state={state}
        onSetView={handleSetView}
        onSetLang={handleSetLang}
        onOpenReport={startReporting}
        onOpenLayers={toggleDatasetLayersPanel}
        isLayersOpen={isDatasetLayerPanelOpen}
        user={authUser}
        canViewReports={canViewReports}
        canCreateReports={canCreateReports}
        canViewLayers={canViewDatasetLayers}
        canViewFireMonitoring={canViewFireMonitoring}
        onLogout={handleLogout}
      />}
      
      <main className="flex-1 relative md:ml-auto h-full min-h-0 min-w-0 overflow-hidden transition-all duration-300">
        {state.view === 'map' && (
          <Suspense fallback={<ScreenLoader label="Loading map" />}>
          <GISMap 
            incidents={state.incidents} 
            activeLayers={state.activeLayers} 
            onReportClick={handleMapClick} 
            onCancelReport={cancelReporting}
            isReporting={state.isReporting} 
            onToggleLayer={toggleLayer}
            onSetBaseLayer={setBaseLayer}
            datasetLayers={datasetLayers}
            activeDatasetLayerIds={activeDatasetLayerIds}
            datasetLayerFilters={datasetLayerFilters}
            datasetLayerRefreshKey={datasetLayerRefreshKey}
            onDatasetPolygonClick={openDatasetFilterForLayer}
            onDatasetLayerLoadingChange={handleDatasetLayerLoadingChange}
            isDarkMode={state.isDarkMode} 
            onToggleTheme={handleToggleTheme} 
            language={state.language} 
            onSetLanguage={handleSetLang}
            canViewMapLayers={canViewMapLayers}
            canViewFwi={canViewFwi}
            canViewFireMonitoring={canViewFireMonitoring}
            canViewAws={canViewAws}
            canViewFbih={canViewFbih}
            canViewRs={canViewRs}
            canAdjustAws={canAdjustAws}
            geoEditorMode={geoEditorMode}
            geoEditorLayerId={selectedDatasetLayerId}
            geoEditorFeatures={geoEditorFeatures}
            geoEditorSelectedFeatureId={geoEditorSelectedFeatureId}
            geoEditorDrawing={geoEditorDrawing}
            geoEditorSnappingEnabled={geoEditorSnappingEnabled}
            geoEditorShowDraft={geoEditorPendingChanges > 0}
            onGeoEditorDrawingChange={setGeoEditorDrawing}
            onGeoEditorFeaturesChange={setGeoEditorFeatures}
            onDatasetFeaturesLoaded={handleDatasetFeaturesLoaded}
            onDatasetEditorFeaturesLoaded={handleDatasetEditorFeaturesLoaded}
            onDatasetEditorLoadError={setGeometrySaveError}
          />
          </Suspense>
        )}

        {state.view !== 'map' && (
          <div className={`h-full w-full overflow-y-auto p-8 ${state.isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <div className="max-w-6xl mx-auto">
              <header className={`mb-10 flex items-center justify-between border-b pb-6 ${state.isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <div>
                  <div className="flex items-center gap-2 text-blue-500 text-xs font-bold tracking-[0.2em] uppercase mb-2">
                    <Database size={14} /> {t.systemCoreData}
                  </div>
                  <h1 className={`text-3xl font-bold tracking-tight ${state.isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {state.view === 'reports' ? t.recentReports : state.view === 'layers' ? t.layers : state.view === 'fires' ? 'Fire monitoring' : t.stats}
                  </h1>
                </div>
                {state.view === 'fires' && <div id="fire-monitoring-header-actions" className="relative flex items-center" />}
              </header>

              {state.view === 'reports' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {state.incidents.map(inc => (
                    <div key={inc.id} className={`group border rounded-xl overflow-hidden transition-all duration-300 shadow-xl ${state.isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-500/50'}`}>
                      <div className={`h-1.5 w-full ${inc.type === IncidentType.FIRE ? 'bg-red-600' : 'bg-blue-600'}`} />
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                           <div className={`p-2 rounded-lg ${inc.type === IncidentType.FIRE ? 'bg-red-600/10 text-red-500' : 'bg-blue-600/10 text-blue-500'}`}>
                             {inc.type === IncidentType.FIRE ? <Flame size={20} /> : <Waves size={20} />}
                           </div>
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${inc.urgency === 'high' ? 'border-red-500/50 text-red-500 bg-red-500/5' : state.isDarkMode ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'}`}>
                             {inc.urgency.toUpperCase()}
                           </span>
                        </div> 
                        <h3 className={`font-bold text-lg mb-2 ${state.isDarkMode ? 'text-white' : 'text-slate-900'}`}>{inc.type === IncidentType.FIRE ? t.fireAlert : t.floodAlert}</h3>
                        <p className={`text-sm leading-relaxed mb-6 line-clamp-3 ${state.isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>"{inc.description}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {state.view === 'stats' && (
                <Suspense fallback={<ScreenLoader label="Loading statistics" />}><StatisticsDashboard language={state.language} isDarkMode={state.isDarkMode} /></Suspense>
              )}
              {state.view === 'fires' && canViewFireMonitoring && (
                <Suspense fallback={<ScreenLoader label="Loading fire operations" />}><FireMonitoringDashboard isDarkMode={state.isDarkMode} canManage={canManageFireMonitoring} canViewIntelligence={canViewFireIntelligence} canRunIntelligence={canRunFireIntelligence} canReviewIntelligence={canReviewFireIntelligence} /></Suspense>
              )}
            </div>
          </div>
        )}

        <Suspense fallback={null}><DatasetLayerOverlay
          isOpen={isDatasetLayerPanelOpen}
          layers={datasetLayers}
          activeLayerIds={activeDatasetLayerIds}
          loadingLayerIds={loadingDatasetLayerIds}
          selectedLayerId={selectedDatasetLayerId}
          filters={datasetLayerFilters}
          isFilterPanelOpen={isDatasetFilterPanelOpen}
          selectedFeature={selectedDatasetFeature}
          editorInitialTab={datasetEditorInitialTab}
          isSavingFeature={isSavingDatasetFeature}
          saveError={datasetFeatureSaveError}
          isLoading={datasetLayersLoading}
          errorMessage={datasetLayersError}
          onClose={closeDatasetLayersPanel}
          onToggleLayer={toggleDatasetLayer}
          onSetCategoryLayersActive={setCategoryDatasetLayersActive}
          onSelectLayer={selectDatasetLayer}
          onFilterPanelOpenChange={setIsDatasetFilterPanelOpen}
          onLayerUpdated={handleDatasetLayerUpdated}
          onUpdateLayerStyle={updateDatasetLayerStyle}
          onSaveLayerStyle={persistDatasetLayerStyle}
          onSaveFeatureAttributes={saveDatasetFeatureAttributes}
          onUpdateFilter={updateDatasetLayerFilter}
          onClearFilter={clearDatasetLayerFilter}
          canUpdateLayer={canUpdateDatasetLayers}
          canCreateLayer={canCreateDatasetLayers}
          canManageRoleAccess={canManageLayerRoleAccess}
          isSuperAdmin={isSuperAdmin}
          geoEditorMode={geoEditorMode}
          geoEditorDrawing={geoEditorDrawing}
          geoEditorSnappingEnabled={geoEditorSnappingEnabled}
          geoEditorNewPolygonName={geoEditorNewPolygonName}
          geoEditorPendingChanges={geoEditorPendingChanges}
          geoEditorSelectedFeatureId={geoEditorSelectedFeatureId}
          isSavingGeometry={isSavingGeometry}
          geometrySaveError={geometrySaveError}
          onGeoEditorModeChange={handleGeoEditorModeChange}
          onGeoEditorSnappingChange={setGeoEditorSnappingEnabled}
          onGeoEditorNewPolygonNameChange={setGeoEditorNewPolygonName}
          onGeoEditorUndoDrawing={() => setGeoEditorDrawing((previous) => previous.slice(0, -1))}
          onGeoEditorClearDrawing={() => setGeoEditorDrawing([])}
          onGeoEditorFinishDrawing={finishGeoEditorDrawing}
          onGeoEditorSave={saveGeoEditor}
          onGeoEditorReset={resetGeoEditor}
        /></Suspense>

        {showModal && (
          <ReportModal 
            language={state.language} 
            location={reportLocation} 
            onClose={() => {
              setShowModal(false);
              setReportLocation(null);
            }} 
            onSubmit={handleReportSubmit} 
          />
        )}
      </main>

      <SessionLoginGate
        user={authUser}
        checking={isCheckingSession}
        onAuthenticated={setAuthUser}
      />
    </div>
  );
};

const ScreenLoader = ({ label }: { label: string }) => (
  <div className="flex h-full w-full items-center justify-center bg-slate-950 text-sm font-bold text-slate-400">{label}...</div>
);

export default App;
