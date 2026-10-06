import React, { useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Map as GLMap, MapMouseEvent } from 'maplibre-gl';
import { MOCK_FORESTS, REGION_STYLES } from '../../constants';
import { MapLayer, RegionType } from '../../types';
import { allFhmzStations, scrape, type AnyStation } from '../../AWSFBiHData';
import { rsAwsDummyData, scrapeRs, type RsStation } from '../../AWSRsData';
import {
  fetchActiveFires, fetchFireIntelligenceProducts, fetchFireScenarioPerimeters,
  fetchFireScenarios, FIRE_REFRESH_MS, type FireEventProperties,
} from '../../services/fireMonitoringService';
import { fetchWindGrid, WIND_REFRESH_MS } from '../../services/windService';
import { renderFwiCogForMapbox } from '../../lib/gis/mapboxRasterImage';
import { insertVertex, outerRings, positionKey, removeVertex, updateVertex, vertices, type Position, type VertexRef } from '../../lib/gis/geoEditor';
import { AWSHoverCard } from './layers/AWS/AWSHoverCard';
import { awsStationIdentity, fetchAwsStationAdjustments, type AwsStationAdjustment } from '../../services/awsStationService';
import { AWS_DATASET_UPDATED_EVENT } from '../../services/awsCurrentService';
import { toCyrillicScript } from '../../lib/text/latinScript';

type PopupLike = { setLngLat: (point: [number, number]) => PopupLike; setHTML: (html: string) => PopupLike; setDOMContent: (element: HTMLElement) => PopupLike; addTo: (map: GLMap) => PopupLike; on: (event: string, handler: () => void) => PopupLike; remove: () => void };
type MarkerLike = { setLngLat: (point: [number, number]) => MarkerLike; addTo: (map: GLMap) => MarkerLike; remove: () => void };
type FeatureMouseEvent = MapMouseEvent & { features?: Array<GeoJSON.Feature & { layer: { id: string } }> };

interface Props {
  map: GLMap;
  activeLayers: Set<MapLayer>;
  canViewMapLayers: boolean;
  canViewFwi: boolean;
  canViewFireMonitoring: boolean;
  canViewAws: boolean;
  canViewFbih: boolean;
  canViewRs: boolean;
  useCyrillicStationNames: boolean;
  canAdjustAws: boolean;
  createMarker: (element: HTMLElement) => MarkerLike;
  createPopup: () => PopupLike;
  onLocationSelect?: (location: { name: string; lat: number; lng: number }) => void;
  selectedFwiProductId?: number | null;
  geoEditorMode: 'view' | 'draw' | 'edit-single' | 'edit-shared';
  geoEditorFeatures: GeoJSON.Feature[];
  geoEditorSelectedFeatureId: string | null;
  geoEditorDrawing: Position[];
  geoEditorSnappingEnabled: boolean;
  geoEditorShowDraft: boolean;
  onGeoEditorDrawingChange: (positions: Position[]) => void;
  onGeoEditorFeaturesChange: (features: GeoJSON.Feature[]) => void;
}

const FIRE_SOURCE = 'nffis-native-fires';
const FIRE_LAYER = 'nffis-native-fires-points';
const SPREAD_SOURCE = 'nffis-native-fire-spread';
const SPREAD_FILL = 'nffis-native-fire-spread-fill';
const SPREAD_LINE = 'nffis-native-fire-spread-line';
const WIND_SOURCE = 'nffis-native-wind';
const WIND_LAYER = 'nffis-native-wind-lines';
const FWI_SOURCE = 'nffis-native-fwi';
const FWI_LAYER = 'nffis-native-fwi-raster';
const FWI_POINTS_SOURCE = 'nffis-native-fwi-points';
const FWI_HEAT_LAYER = 'nffis-native-fwi-heat';
const METEOBLUE_SOURCE = 'nffis-native-meteoblue';
const METEOBLUE_LAYER = 'nffis-native-meteoblue-raster';
const EDIT_SOURCE = 'nffis-native-editor';
const EDIT_FILL = 'nffis-native-editor-fill';
const EDIT_LINE = 'nffis-native-editor-line';
const EDIT_VERTEX_SOURCE = 'nffis-native-editor-vertices';
const EDIT_VERTEX_LAYER = 'nffis-native-editor-vertices-layer';

const FBIH_COORDS: Record<string, [number, number]> = {
  'Divičani':[17.29,44.38], 'Dobrošin':[17.65,43.88], 'Gornji Kamengrad':[16.55,44.80], 'Gračanica kod Bugojna':[17.48,44.02],
  'Kupres':[17.27,43.99], 'Pidriš':[17.58,43.88], 'Rat':[18.06,44.38], 'Ripač':[15.93,44.76], 'Rovna':[17.46,44.07],
  'Šeherdžik':[17.53,43.91], 'Voljice-Gaj':[17.61,43.93], 'Sanica':[16.63,44.60], 'Budim Potok':[17.75,44.20],
  'Ustikolina':[18.79,43.58], 'Sapna':[18.99,44.50], 'Snježnica':[18.96,44.57], 'Bijela Voda':[18.25,43.94],
  'Bjelašnica-Babin Do':[18.28,43.71], 'Sarajevo-Faletići':[18.45,43.87], 'Srednje':[18.43,43.98], 'Vareš':[18.32,44.16],
  'Vlašić-Babanovac':[17.61,44.28], 'Visoko':[18.17,43.98], 'Tešanj':[17.98,44.61], 'Goražde':[18.97,43.66],
  'Sarajevo-Butmir':[18.33,43.82], 'Gabela':[17.68,43.06], 'Odžak':[18.32,45.01], 'Kalesija':[18.87,44.44],
  'Brčko':[18.81,44.87], 'G.Vakuf Uskoplje':[17.58,43.93], 'Gračanica':[18.30,44.70], 'Grude':[17.41,43.37],
  'Kakanj':[18.11,44.12], 'Kiseljak':[18.08,43.94], 'Kladanj':[18.69,44.22], 'Maglaj':[18.10,44.54],
  'Neum':[17.61,42.92], 'Sarajevo':[18.41,43.85], 'Široki Brijeg':[17.59,43.38], 'Travnik':[17.66,44.22],
  'Tuzla':[18.67,44.53], 'Zenica':[17.90,44.20], 'Žepče':[18.03,44.42],
};

const REGION_ICON_PATHS: Record<string, string> = {
  tree: `<path d="M12 19v3"/><path d="M12 19h-3a9 9 0 0 1 0-18h6a9 9 0 0 1 0 18h-3"/>`,
  pine: `<path d="m8 14 4-9 4 9"/><path d="m10 14-3 9"/><path d="m14 14 3 9"/>`,
  mixed: `<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .9-1.7l-2.6-5a1 1 0 0 0-1.8 0l-2.6 5a1 1 0 0 0 .9 1.7h.2l-1.4 2.5"/>`,
  shrub: `<path d="M12 22v-9"/><path d="M6.06 14a4 4 0 0 1 7.15-2.73"/><path d="M12.8 11.27a4 4 0 0 1 5.14 8.73"/><path d="M18.66 16.32a4 4 0 0 1-1.37 5.68"/><path d="M4.69 13.9a4 4 0 0 0-.25 7.84"/>`,
  sprout: `<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .5-3.5 1.3-3.5 1.3s-.9-2.4 0-4.6c.9-2.1 2.2-2 2.2-2"/>`,
  trash: `<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>`,
};

function assetMarkerElement(type: RegionType): HTMLButtonElement {
  const style = REGION_STYLES[type];
  const element = document.createElement('button');
  element.type = 'button';
  element.setAttribute('aria-label', type);
  element.style.cssText = `width:32px;height:32px;border-radius:999px;border:2px solid ${style.color};background:rgba(2,6,23,.94);display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px ${style.color}66;cursor:pointer;color:${style.color};padding:6px`;
  element.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${REGION_ICON_PATHS[style.iconType] || REGION_ICON_PATHS.tree}</svg>`;
  return element;
}

function awsMarkerElement(station: AnyStation | RsStation, color: string, name: string): HTMLButtonElement {
  const element = document.createElement('button');
  const value = station.type === 'unclassified' ? 'RAW' : station.tempC == null ? '–' : `${station.tempC}°`;
  const icon = station.type === 'precipitation'
    ? `<path d="M12 2.7S6.5 9 6.5 13.3a5.5 5.5 0 0 0 11 0C17.5 9 12 2.7 12 2.7Z"/><path d="M9.5 14.2a2.8 2.8 0 0 0 2.5 2.1"/>`
    : station.type === 'agro'
      ? `<path d="M12 22V12"/><path d="M7 12c3 0 5 2 5 5-3 0-5-2-5-5Z"/><path d="M17 7c-3 0-5 2-5 5 3 0 5-2 5-5Z"/>`
      : station.type === 'unclassified'
        ? `<path d="M4 12h3l2-4 4 8 2-4h5"/>`
        : `<path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0Z"/><path d="M12 9v7"/>`;
  element.type = 'button';
  element.title = name;
  element.setAttribute('aria-label', `${name}: ${value}`);
  element.style.cssText = `width:40px;height:40px;border-radius:999px;border:2px solid ${color};background:rgba(2,6,23,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;box-shadow:0 0 10px ${color}66;cursor:pointer;color:white;padding:3px;font:700 9px ui-monospace,monospace;line-height:1`;
  element.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg><span>${value}</span>`;
  return element;
}

function remove(map: GLMap, layers: string[], sources: string[]) {
  // React runs the parent's effect cleanup before child effect cleanups. The
  // parent may already have called map.remove(), which clears Mapbox's style.
  if (!(map as GLMap & { style?: unknown }).style) return;
  layers.forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
  sources.forEach(id => { if (map.getSource(id)) map.removeSource(id); });
}
function esc(value: unknown) { return String(value ?? '—').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]!)); }
function stationName(station: AnyStation) { return 'city' in station ? station.city : station.station; }
function enabledAws(station: AnyStation, active: Set<MapLayer>) {
  return station.type === 'precipitation' ? active.has(MapLayer.AWS_PRECIPITATION)
    : station.type === 'agro' ? active.has(MapLayer.AWS_AGRO)
    : station.type === 'unclassified' ? active.has(MapLayer.AWS_SENSORS) : active.has(MapLayer.AWS_METEO);
}
function fireColor(event: FireEventProperties) {
  if (!event.is_active) return '#64748b';
  if (event.status === 'reignited' || (event.peak_frp ?? 0) >= 200) return '#7f1d1d';
  if (event.status === 'intensified' || (event.peak_frp ?? 0) >= 50) return '#dc2626';
  return (event.peak_frp ?? 0) >= 10 ? '#f97316' : '#facc15';
}
function popupHtml(title: string, rows: Array<[string, unknown]>) {
  return `<div style="min-width:230px;background:#020617;color:#e2e8f0;padding:14px;border:1px solid #334155;border-radius:10px;font:12px system-ui"><b style="font-size:14px;color:white">${esc(title)}</b>${rows.map(([key,value]) => `<div style="display:flex;justify-content:space-between;gap:14px;margin-top:7px"><span style="color:#64748b">${esc(key)}</span><strong>${esc(value)}</strong></div>`).join('')}</div>`;
}

export function MapboxOperationalLayers(props: Props) {
  const { map, activeLayers } = props;
  const popupRef = useRef<PopupLike | null>(null);
  const popupRootRef = useRef<Root | null>(null);
  const fireEventsRef = useRef<FireEventProperties[]>([]);
  const selectedVertexRef = useRef<VertexRef | null>(null);
  const [awsAdjustments, setAwsAdjustments] = useState<AwsStationAdjustment[]>([]);
  const [awsRevision, setAwsRevision] = useState(0);
  const assetSignature = `${Number(activeLayers.has(MapLayer.FORESTS))}|${Number(activeLayers.has(MapLayer.LANDFILLS))}`;
  const fireSignature = `${Number(activeLayers.has(MapLayer.ACTIVE_FIRES))}|${Number(activeLayers.has(MapLayer.FWI_FIRE_SPREAD))}`;
  const awsSignature = `${Number(activeLayers.has(MapLayer.AWS_PRECIPITATION))}|${Number(activeLayers.has(MapLayer.AWS_AGRO))}|${Number(activeLayers.has(MapLayer.AWS_METEO))}|${Number(activeLayers.has(MapLayer.AWS_SENSORS))}`;
  const windVisible = activeLayers.has(MapLayer.WIND_VECTOR) || activeLayers.has(MapLayer.WINDY);
  const meteoblueVisible = activeLayers.has(MapLayer.METEOBLUE);
  const fwiSignature = [MapLayer.FWI_ANGSTROM, MapLayer.FWI_GFI, MapLayer.FWI_KBDI, MapLayer.FWI_BOSNIAN, MapLayer.FIRE_INTELLIGENCE_FWI]
    .map((layer) => Number(activeLayers.has(layer))).join('|');

  useEffect(() => {
    if (!props.canViewAws) return;
    const controller = new AbortController();
    fetchAwsStationAdjustments(controller.signal).then(setAwsAdjustments).catch(() => setAwsAdjustments([]));
    return () => controller.abort();
  }, [props.canViewAws]);
  useEffect(() => () => { popupRootRef.current?.unmount(); popupRef.current?.remove(); }, []);
  useEffect(() => {
    const refresh = () => setAwsRevision((value) => value + 1);
    window.addEventListener(AWS_DATASET_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(AWS_DATASET_UPDATED_EVENT, refresh);
  }, []);

  useEffect(() => {
    if (!props.canViewMapLayers) return;
    const markers = MOCK_FORESTS
      .filter(item => item.type === RegionType.LANDFILL ? activeLayers.has(MapLayer.LANDFILLS) : activeLayers.has(MapLayer.FORESTS))
      .map((item) => {
        const coordinates: [number, number] = [item.coordinates[1], item.coordinates[0]];
        const element = assetMarkerElement(item.type);
        element.addEventListener('mouseenter', () => {
          popupRef.current?.remove();
          popupRef.current = props.createPopup().setLngLat(coordinates).setHTML(popupHtml(item.name, [
            ['Type', item.type], ['Area', `${item.area} ha`], ['Risk', `${Math.round(item.riskScore * 100)}%`],
          ])).addTo(map);
        });
        element.addEventListener('mouseleave', () => { popupRef.current?.remove(); popupRef.current = null; });
        element.addEventListener('click', (event) => {
          event.stopPropagation();
          props.onLocationSelect?.({ name: item.name, lat: item.coordinates[0], lng: item.coordinates[1] });
        });
        return props.createMarker(element).setLngLat(coordinates).addTo(map);
      });
    return () => markers.forEach(marker => marker.remove());
  }, [assetSignature, map, props.canViewMapLayers, props.createMarker, props.createPopup, props.onLocationSelect]);

  useEffect(() => {
    if (!props.canViewFireMonitoring || !activeLayers.has(MapLayer.ACTIVE_FIRES)) { remove(map,[FIRE_LAYER,SPREAD_FILL,SPREAD_LINE],[FIRE_SOURCE,SPREAD_SOURCE]); return; }
    let alive = true; let controller: AbortController | null = null;
    const load = async () => {
      controller?.abort(); controller = new AbortController();
      try {
        const collection = await fetchActiveFires(true, controller.signal); if (!alive) return;
        fireEventsRef.current = collection.features.map(feature => feature.properties);
        remove(map,[FIRE_LAYER],[FIRE_SOURCE]);
        map.addSource(FIRE_SOURCE,{ type:'geojson', data:collection });
        map.addLayer({ id:FIRE_LAYER,type:'circle',source:FIRE_SOURCE,paint:{'circle-radius':['interpolate',['linear'],['coalesce',['get','peak_frp'],0],0,7,200,17],'circle-color':['case',['==',['get','is_active'],false],'#64748b',['>=',['coalesce',['get','peak_frp'],0],200],'#7f1d1d',['>=',['coalesce',['get','peak_frp'],0],50],'#dc2626',['>=',['coalesce',['get','peak_frp'],0],10],'#f97316','#facc15'],'circle-stroke-color':'#fff','circle-stroke-width':1.5,'circle-opacity':.9} });
        if (activeLayers.has(MapLayer.FWI_FIRE_SPREAD)) {
          const groups = await Promise.all(fireEventsRef.current.filter(event => event.is_active).map(async event => { const runs=await fetchFireScenarios(event.id,controller!.signal); const latest=runs.data.find(run=>run.artifact_urls?.perimeters&&['review_required','approved'].includes(run.status)); return latest ? (await fetchFireScenarioPerimeters(event.id,latest.id,controller!.signal)).features : []; }));
          remove(map,[SPREAD_FILL,SPREAD_LINE],[SPREAD_SOURCE]);
          const features=groups.flat(); if(features.length){map.addSource(SPREAD_SOURCE,{type:'geojson',data:{type:'FeatureCollection',features}}); map.addLayer({id:SPREAD_FILL,type:'fill',source:SPREAD_SOURCE,paint:{'fill-color':['match',['to-number',['get','horizon_h']],1,'#facc15',3,'#f97316',6,'#dc2626','#7f1d1d'],'fill-opacity':.18}}); map.addLayer({id:SPREAD_LINE,type:'line',source:SPREAD_SOURCE,paint:{'line-color':['match',['to-number',['get','horizon_h']],1,'#facc15',3,'#f97316',6,'#dc2626','#7f1d1d'],'line-width':2}});}
        }
      } catch(error){if(alive && controller && !controller.signal.aborted && (error as Error).name!=='AbortError') console.warn('Native fire layer unavailable',error);}
    };
    void load(); const timer=window.setInterval(load,FIRE_REFRESH_MS);
    const click=(event:FeatureMouseEvent)=>{const feature=event.features?.[0];if(!feature)return;const p=feature.properties||{};popupRef.current?.remove();popupRef.current=props.createPopup().setLngLat((feature.geometry as GeoJSON.Point).coordinates as [number,number]).setHTML(popupHtml('Active fire',[['Status',p.status],['Peak FRP',`${p.peak_frp ?? '—'} MW`],['Detections',p.detection_count],['Municipality',p.municipality]])).addTo(map);};
    map.on('click',FIRE_LAYER,click);
    const enter=(event:FeatureMouseEvent)=>{map.getCanvas().style.cursor='pointer';click(event);};
    const leave=()=>{map.getCanvas().style.cursor='';popupRef.current?.remove();popupRef.current=null;};
    map.on('mouseenter',FIRE_LAYER,enter);map.on('mouseleave',FIRE_LAYER,leave);
    return()=>{alive=false;controller?.abort();window.clearInterval(timer);map.off('click',FIRE_LAYER,click);map.off('mouseenter',FIRE_LAYER,enter);map.off('mouseleave',FIRE_LAYER,leave);remove(map,[FIRE_LAYER,SPREAD_FILL,SPREAD_LINE],[FIRE_SOURCE,SPREAD_SOURCE]);};
  },[fireSignature,map,props.canViewFireMonitoring,props.createPopup]);

  useEffect(() => {
    const visible=props.canViewAws&&(activeLayers.has(MapLayer.AWS_PRECIPITATION)||activeLayers.has(MapLayer.AWS_AGRO)||activeLayers.has(MapLayer.AWS_METEO)||activeLayers.has(MapLayer.AWS_SENSORS));
    if(!visible)return;
    let alive=true;
    const markers:MarkerLike[]=[];
    const cancelHoverClosers: Array<() => void> = [];
    const addStation=(source:'fbih'|'rs',sourceStation:AnyStation|RsStation,name:string,coordinates:[number,number],color:string)=>{
      const adjustment=awsAdjustments.find(item=>awsStationIdentity(item.source,item.station_type,item.station_key)===awsStationIdentity(source,sourceStation.type,name));
      const station=adjustment?{...sourceStation,...adjustment.values} as AnyStation|RsStation:sourceStation;
      const element=awsMarkerElement(station,color,props.useCyrillicStationNames?toCyrillicScript(name):name);
      let closeTimer: ReturnType<typeof setTimeout> | undefined;
      let stationPopup: PopupLike | null = null;
      const cancelClose=()=>{if(closeTimer)clearTimeout(closeTimer);closeTimer=undefined;};
      const scheduleClose=()=>{cancelClose();closeTimer=setTimeout(()=>{if(popupRef.current===stationPopup){stationPopup?.remove();popupRef.current=null;}},180);};
      cancelHoverClosers.push(cancelClose);
      const openStationPopup=()=>{
        cancelClose();
        popupRef.current?.remove();popupRef.current=null;
        if(popupRootRef.current){popupRootRef.current.unmount();popupRootRef.current=null;}
        const container=document.createElement('div');const root=createRoot(container);popupRootRef.current=root;
        container.addEventListener('mouseenter',cancelClose);
        container.addEventListener('mouseleave',scheduleClose);
        root.render(<AWSHoverCard station={station} source={source} canAdjust={props.canAdjustAws} useCyrillicStationNames={props.useCyrillicStationNames} adjustment={adjustment} onAdjusted={value=>setAwsAdjustments(current=>[...current.filter(item=>item.id!==value.id),value])}/>);
        const popup=props.createPopup().setLngLat(coordinates).setDOMContent(container).addTo(map).on('close',()=>{cancelClose();if(popupRootRef.current===root){root.unmount();popupRootRef.current=null;}});popupRef.current=popup;stationPopup=popup;
      };
      element.addEventListener('mouseenter',openStationPopup);
      element.addEventListener('mouseleave',scheduleClose);
      element.addEventListener('focus',openStationPopup);
      element.addEventListener('click',(event)=>{event.stopPropagation();openStationPopup();});
      markers.push(props.createMarker(element).setLngLat(coordinates).addTo(map));
    };
    Promise.all([props.canViewFbih?scrape().catch(()=>null):Promise.resolve(null),props.canViewRs?scrapeRs().catch(()=>null):Promise.resolve(null)]).then(([fbih,rs])=>{
      if(!alive)return;
      if(props.canViewFbih)(fbih?.all??allFhmzStations).filter(station=>enabledAws(station,activeLayers)).forEach((station:AnyStation)=>{const name=stationName(station),position=station as AnyStation & {lat?:number;lon?:number},coordinates=Number.isFinite(position.lat)&&Number.isFinite(position.lon)?[position.lon!,position.lat!] as [number,number]:FBIH_COORDS[name];if(coordinates)addStation('fbih',station,name,coordinates,station.type==='unclassified'?'#f59e0b':station.type==='agro'?'#eab308':station.type==='precipitation'?'#06b6d4':'#10b981');});
      if(props.canViewRs&&activeLayers.has(MapLayer.AWS_METEO))(rs?.stations??rsAwsDummyData.stations).forEach((station:RsStation)=>addStation('rs',station,station.name,[station.lon,station.lat],'#818cf8'));
    });
    return()=>{alive=false;cancelHoverClosers.forEach(cancel=>cancel());markers.forEach(marker=>marker.remove());};
  },[awsSignature,awsAdjustments,awsRevision,map,props.canAdjustAws,props.canViewAws,props.canViewFbih,props.canViewRs,props.createMarker,props.createPopup,props.useCyrillicStationNames]);

  useEffect(()=>{
    const visible=props.canViewMapLayers&&(activeLayers.has(MapLayer.WIND_VECTOR)||activeLayers.has(MapLayer.WINDY));if(!visible){remove(map,[WIND_LAYER],[WIND_SOURCE]);return;}
    let alive=true;const controller=new AbortController();const load=()=>fetchWindGrid(undefined,controller.signal).then(grid=>{if(!alive)return;const u=grid[0],v=grid[1],h=u.header as Record<string,number>;const features:GeoJSON.Feature<GeoJSON.LineString>[]=[];for(let y=0;y<h.ny;y++)for(let x=0;x<h.nx;x++){const i=y*h.nx+x,uu=u.data[i],vv=v.data[i];if(uu==null||vv==null)continue;const lng=h.lo1+x*h.dx,lat=h.la1-y*h.dy,speed=Math.hypot(uu,vv);features.push({type:'Feature',geometry:{type:'LineString',coordinates:[[lng,lat],[lng+uu*.018,lat+vv*.018]]},properties:{speed}});}remove(map,[WIND_LAYER],[WIND_SOURCE]);map.addSource(WIND_SOURCE,{type:'geojson',data:{type:'FeatureCollection',features}});map.addLayer({id:WIND_LAYER,type:'line',source:WIND_SOURCE,paint:{'line-width':['interpolate',['linear'],['get','speed'],0,1,15,3],'line-opacity':.8,'line-color':['interpolate',['linear'],['get','speed'],0,'#38bdf8',5,'#2dd4bf',10,'#facc15',15,'#ef4444']}});}).catch(e=>{if((e as Error).name!=='AbortError')console.warn('Native wind unavailable',e);});void load();const timer=window.setInterval(load,WIND_REFRESH_MS);return()=>{alive=false;controller.abort();window.clearInterval(timer);remove(map,[WIND_LAYER],[WIND_SOURCE]);};
  },[map,props.canViewMapLayers,windVisible]);

  useEffect(()=>{
    if(!activeLayers.has(MapLayer.METEOBLUE)||!props.canViewMapLayers){remove(map,[METEOBLUE_LAYER],[METEOBLUE_SOURCE]);return;}let alive=true;const controller=new AbortController();fetch('https://maps-api.meteoblue.com/v1/time/hourly/ICONAUTO?lang=en&apikey=be72f76237db',{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json();}).then(data=>{if(!alive)return;const url=`https://maps-api.meteoblue.com/v1/map/raster/ICONAUTO/${data.current}/11~2%20m%20above%20gnd~hourly~none~contourSteps~-10.0~rgba(52,140,237,1.0)~0.0~rgba(0,239,124,1.0)~10.0~rgba(0,114,41,1.0)~20.0~rgba(255,246,0,1.0)~30.0~rgba(255,102,0,1.0)/{z}/{x}/{y}?temperatureUnit=C&apikey=be72f76237db&lastUpdate=${data.lastUpdate}`;remove(map,[METEOBLUE_LAYER],[METEOBLUE_SOURCE]);map.addSource(METEOBLUE_SOURCE,{type:'raster',tiles:[url],tileSize:256});map.addLayer({id:METEOBLUE_LAYER,type:'raster',source:METEOBLUE_SOURCE,paint:{'raster-opacity':.78}});}).catch(e=>{if((e as Error).name!=='AbortError')console.warn('Meteoblue unavailable',e);});return()=>{alive=false;controller.abort();remove(map,[METEOBLUE_LAYER],[METEOBLUE_SOURCE]);};
  },[map,meteoblueVisible,props.canViewMapLayers]);

  useEffect(()=>{
    const fwiActive=props.canViewFwi&&[MapLayer.FWI_ANGSTROM,MapLayer.FWI_GFI,MapLayer.FWI_KBDI,MapLayer.FWI_BOSNIAN,MapLayer.FIRE_INTELLIGENCE_FWI].some(layer=>activeLayers.has(layer));if(!fwiActive){remove(map,[FWI_LAYER,FWI_HEAT_LAYER],[FWI_SOURCE,FWI_POINTS_SOURCE]);return;}let release:(()=>void)|null=null;const controller=new AbortController();const load=async()=>{try{const wantsCog=activeLayers.has(MapLayer.FWI_BOSNIAN)||activeLayers.has(MapLayer.FIRE_INTELLIGENCE_FWI);if(!wantsCog)throw new Error('Use calculated index surface.');let id=props.selectedFwiProductId;if(!id){const products=await fetchFireIntelligenceProducts(controller.signal);id=products.data.filter(p=>p.index_type==='FWI'&&p.forecast_day===0&&p.status==='approved'&&p.artifact_urls?.cog).sort((a,b)=>Date.parse(b.valid_at)-Date.parse(a.valid_at))[0]?.id;}if(!id)throw new Error('No approved FWI product.');const image=await renderFwiCogForMapbox(`/api/fire-intelligence/products/${id}/artifact/cog`,controller.signal);release=image.release;if(controller.signal.aborted)return;remove(map,[FWI_LAYER],[FWI_SOURCE]);map.addSource(FWI_SOURCE,{type:'image',url:image.url,coordinates:image.coordinates});map.addLayer({id:FWI_LAYER,type:'raster',source:FWI_SOURCE,paint:{'raster-opacity':.78,'raster-resampling':'linear'}});}catch(e){if(controller.signal.aborted||(e as Error).name==='AbortError')return;const key=activeLayers.has(MapLayer.FWI_ANGSTROM)?'angstrom':activeLayers.has(MapLayer.FWI_GFI)?'gfi':activeLayers.has(MapLayer.FWI_KBDI)?'kbdi':'fwi';const max=key==='angstrom'?6:key==='gfi'?15:key==='kbdi'?800:80;const features=MOCK_FORESTS.filter(f=>f.type!==RegionType.LANDFILL).map(f=>({type:'Feature' as const,geometry:{type:'Point' as const,coordinates:[f.coordinates[1],f.coordinates[0]]},properties:{value:key==='angstrom'?6-f.riskScore*4:key==='gfi'?f.riskScore*15:key==='kbdi'?f.riskScore*700:f.riskScore*80}}));map.addSource(FWI_POINTS_SOURCE,{type:'geojson',data:{type:'FeatureCollection',features}});map.addLayer({id:FWI_HEAT_LAYER,type:'heatmap',source:FWI_POINTS_SOURCE,paint:{'heatmap-weight':['interpolate',['linear'],['get','value'],0,0,max,1],'heatmap-radius':70,'heatmap-opacity':.72,'heatmap-color':['interpolate',['linear'],['heatmap-density'],0,'rgba(34,197,94,0)',.3,'#facc15',.55,'#f97316',.8,'#dc2626',1,'#581c87']}});}};void load();return()=>{controller.abort();release?.();remove(map,[FWI_LAYER,FWI_HEAT_LAYER],[FWI_SOURCE,FWI_POINTS_SOURCE]);};
  },[fwiSignature,map,props.canViewFwi,props.selectedFwiProductId]);

  useEffect(()=>{
    remove(map,[EDIT_FILL,EDIT_LINE,EDIT_VERTEX_LAYER],[EDIT_SOURCE,EDIT_VERTEX_SOURCE]);
    if(props.geoEditorMode==='view'&&!props.geoEditorShowDraft)return;
    const drawing=props.geoEditorDrawing;
    const draftFeatures=[...props.geoEditorFeatures];if(drawing.length>1)draftFeatures.push({type:'Feature',properties:{__drawing:true},geometry:drawing.length>=3?{type:'Polygon',coordinates:[[...drawing,drawing[0]]]}:{type:'LineString',coordinates:drawing}} as GeoJSON.Feature);
    map.addSource(EDIT_SOURCE,{type:'geojson',data:{type:'FeatureCollection',features:draftFeatures}});map.addLayer({id:EDIT_FILL,type:'fill',source:EDIT_SOURCE,filter:['==',['geometry-type'],'Polygon'],paint:{'fill-color':['case',['get','__drawing'],'#ec4899','#f59e0b'],'fill-opacity':.12}});map.addLayer({id:EDIT_LINE,type:'line',source:EDIT_SOURCE,paint:{'line-color':['case',['get','__drawing'],'#ec4899','#f59e0b'],'line-width':3,'line-dasharray':[2,2]}});
    const allRefs=vertices(props.geoEditorFeatures);const selectedIndex=props.geoEditorFeatures.findIndex(feature=>String(feature.id??feature.properties?.id)===props.geoEditorSelectedFeatureId);const refs=props.geoEditorMode==='edit-single'?allRefs.filter(ref=>ref.featureIndex===selectedIndex):allRefs;
    const vertexFeatures:GeoJSON.Feature<GeoJSON.Point>[] = refs.map((ref,index)=>({type:'Feature',id:`vertex-${index}`,geometry:{type:'Point',coordinates:ref.position},properties:{kind:'vertex',index,key:positionKey(ref.position)}}));
    if(props.geoEditorMode==='edit-single'||props.geoEditorMode==='edit-shared')props.geoEditorFeatures.forEach((feature,featureIndex)=>{if(props.geoEditorMode==='edit-single'&&featureIndex!==selectedIndex)return;outerRings(feature.geometry).forEach((ring,polygonIndex)=>ring.forEach((position,vertexIndex)=>{const next=ring[(vertexIndex+1)%ring.length];vertexFeatures.push({type:'Feature',geometry:{type:'Point',coordinates:[(position[0]+next[0])/2,(position[1]+next[1])/2]},properties:{kind:'midpoint',featureIndex,polygonIndex,vertexIndex}});}));});
    if(vertexFeatures.length){map.addSource(EDIT_VERTEX_SOURCE,{type:'geojson',data:{type:'FeatureCollection',features:vertexFeatures}});map.addLayer({id:EDIT_VERTEX_LAYER,type:'circle',source:EDIT_VERTEX_SOURCE,paint:{'circle-radius':['case',['==',['get','kind'],'midpoint'],5,6],'circle-color':['case',['==',['get','kind'],'midpoint'],'#ffffff','#2563eb'],'circle-stroke-color':['case',['==',['get','kind'],'midpoint'],'#9333ea','#ffffff'],'circle-stroke-width':2}});}
    const click=(event:FeatureMouseEvent)=>{if(props.geoEditorMode==='draw'){const raw:Position=[event.lngLat.lng,event.lngLat.lat];let point=raw;if(props.geoEditorSnappingEnabled){const candidate=allRefs.map(ref=>({ref,distance:Math.hypot(ref.position[0]-raw[0],ref.position[1]-raw[1])})).sort((a,b)=>a.distance-b.distance)[0];if(candidate&&candidate.distance<.001)point=[...candidate.ref.position];}props.onGeoEditorDrawingChange([...drawing,point]);return;}const hit=(map as GLMap & {style?: unknown}).style&&map.getLayer(EDIT_VERTEX_LAYER)?map.queryRenderedFeatures(event.point,{layers:[EDIT_VERTEX_LAYER]})[0]:undefined;if(hit?.properties?.kind==='midpoint'){const ref:VertexRef={featureIndex:Number(hit.properties.featureIndex),polygonIndex:Number(hit.properties.polygonIndex),ringIndex:0,vertexIndex:Number(hit.properties.vertexIndex),position:(hit.geometry as GeoJSON.Point).coordinates as Position};props.onGeoEditorFeaturesChange(insertVertex(props.geoEditorFeatures,ref,(hit.geometry as GeoJSON.Point).coordinates as Position,props.geoEditorMode==='edit-shared'));return;}if(hit?.properties?.kind==='vertex'){selectedVertexRef.current=refs[Number(hit.properties.index)]??null;return;}if(selectedVertexRef.current){props.onGeoEditorFeaturesChange(updateVertex(props.geoEditorFeatures,selectedVertexRef.current,[event.lngLat.lng,event.lngLat.lat],props.geoEditorMode==='edit-shared'));selectedVertexRef.current=null;}};
    const context=(event:FeatureMouseEvent)=>{const vertex=event.features?.[0];if(!vertex||vertex.properties?.kind!=='vertex')return;event.preventDefault();const ref=refs[Number(vertex.properties?.index)];if(ref)props.onGeoEditorFeaturesChange(removeVertex(props.geoEditorFeatures,ref,props.geoEditorMode==='edit-shared'));};
    map.on('click',click);if(map.getLayer(EDIT_VERTEX_LAYER))map.on('contextmenu',EDIT_VERTEX_LAYER,context);return()=>{map.off('click',click);if((map as GLMap & {style?: unknown}).style&&map.getLayer(EDIT_VERTEX_LAYER))map.off('contextmenu',EDIT_VERTEX_LAYER,context);remove(map,[EDIT_FILL,EDIT_LINE,EDIT_VERTEX_LAYER],[EDIT_SOURCE,EDIT_VERTEX_SOURCE]);};
  },[map,props.geoEditorDrawing,props.geoEditorFeatures,props.geoEditorMode,props.geoEditorSelectedFeatureId,props.geoEditorShowDraft,props.geoEditorSnappingEnabled,props.onGeoEditorDrawingChange,props.onGeoEditorFeaturesChange]);

  return null;
}
