import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchActiveFires, FIRE_REFRESH_MS, type FireEventProperties } from '../../../services/fireMonitoringService';

const esc = (value: unknown) => String(value ?? '—').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]!));
const date = (value: string) => new Date(value).toLocaleString();

function color(event: FireEventProperties): string {
  if (!event.is_active) return '#64748b';
  if (event.status === 'reignited' || (event.peak_frp ?? 0) >= 200) return '#7f1d1d';
  if (event.status === 'intensified' || (event.peak_frp ?? 0) >= 50) return '#dc2626';
  if (event.confidence_level === 'high_confidence' || (event.peak_frp ?? 0) >= 10) return '#f97316';
  return '#facc15';
}

function popup(event: FireEventProperties): string {
  const year = new Date(event.last_seen_at).getUTCFullYear();
  const confidence = event.confidence_level === 'high_confidence' ? 'High confidence / corroborated fire' : event.confidence_level === 'likely_fire' ? 'Likely fire' : 'Unconfirmed satellite thermal anomaly';
  const place = [event.municipality, event.canton, event.entity].filter(Boolean).join(' · ') || 'Bosnia and Herzegovina';
  const stat = (label: string, value: unknown) => `<div style="background:rgba(15,23,42,.65);border:1px solid #1e293b;border-radius:8px;padding:8px"><span style="display:block;color:#64748b;font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase">${esc(label)}</span><span style="display:block;color:#cbd5e1;font-family:ui-monospace,monospace;font-size:12px;margin-top:3px">${esc(value)}</span></div>`;
  const detail = (label: string, value: unknown) => value ? `<div style="display:flex;justify-content:space-between;gap:12px;margin-top:5px;font-size:11px"><span style="color:#64748b">${esc(label)}</span><span style="color:#e2e8f0;text-align:right">${esc(value)}</span></div>` : '';

  return `<div style="width:270px;overflow:hidden;border:1px solid #334155;border-radius:12px;background:rgba(2,6,23,.96);box-shadow:0 0 30px rgba(0,0,0,.45);font-family:ui-sans-serif,system-ui,sans-serif;color:white"><div style="height:3px;background:${color(event)}"></div><div style="padding:14px"><div style="display:flex;justify-content:space-between;gap:10px"><div><div style="font-size:14px;font-weight:700;line-height:1.2">${esc(confidence)}</div><div style="margin-top:4px;color:#94a3b8;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase">${esc(place)}</div></div><div style="color:${color(event)};font-size:11px;font-weight:800;text-align:right">${esc(event.status)}</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">${stat('Peak FRP', `${event.peak_frp ?? '—'} MW`)}${stat('Detections', event.detection_count)}${stat('Coordinates', `${event.latitude.toFixed(3)}, ${event.longitude.toFixed(3)}`)}${stat('Sources', event.sources.join(', '))}</div><div style="margin-top:10px;border-top:1px solid #1e293b;padding-top:5px">${detail('Latest detection', date(event.last_seen_at))}${detail('Management unit', event.management_unit)}${detail('Compartment', [event.compartment, event.sub_compartment].filter(Boolean).join(' / '))}${detail('Nearest road', event.nearest_road?.distance_m != null ? `${Math.round(event.nearest_road.distance_m)} m${event.nearest_road.source || event.nearest_road.layer ? ` · ${esc(event.nearest_road.source || event.nearest_road.layer)}` : ''}` : `No mapped road within 20 km`)}</div><div style="margin-top:9px;color:#64748b;font-size:8px;line-height:1.35">NASA FIRMS/LANCE · modified EUMETSAT Meteosat ${year} · modified Copernicus Sentinel ${year}</div></div></div>`;
}

export function FireMonitoringLayer({ visible, includeRecentExtinguished = true }: { visible: boolean; includeRecentExtinguished?: boolean }) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (!visible) { if (layerRef.current) map.removeLayer(layerRef.current); layerRef.current = null; return; }
    let alive = true;
    let controller: AbortController | null = null;
    const load = async () => {
      controller?.abort(); controller = new AbortController();
      try {
        const collection = await fetchActiveFires(includeRecentExtinguished, controller.signal);
        if (!alive) return;
        if (layerRef.current) map.removeLayer(layerRef.current);
        layerRef.current = L.geoJSON(collection, {
          pointToLayer: (feature, latlng) => {
            const event = feature.properties as FireEventProperties;
            return L.circleMarker(latlng, { radius: Math.max(7, Math.min(17, 7 + Math.sqrt(event.peak_frp ?? 0))), color: '#fff', weight: 1.5, fillColor: color(event), fillOpacity: event.is_active ? 0.9 : 0.45 });
          },
          onEachFeature: (feature, layer) => {
            layer.bindPopup(popup(feature.properties as FireEventProperties), { className: 'fire-monitoring-popup', maxWidth: 290, closeButton: false, autoClose: true });
            layer.on({ mouseover: () => layer.openPopup(), mouseout: () => layer.closePopup() });
          },
        }).addTo(map);
      } catch (error) { if ((error as Error).name !== 'AbortError') console.warn('Fire monitoring layer unavailable', error); }
    };
    void load(); const timer = window.setInterval(load, FIRE_REFRESH_MS);
    return () => { alive = false; controller?.abort(); window.clearInterval(timer); if (layerRef.current) map.removeLayer(layerRef.current); layerRef.current = null; };
  }, [includeRecentExtinguished, map, visible]);

  return <style>{`.fire-monitoring-popup .leaflet-popup-content-wrapper,.fire-monitoring-popup .leaflet-popup-tip{background:transparent;box-shadow:none}.fire-monitoring-popup .leaflet-popup-content{margin:0;width:auto!important}.fire-monitoring-popup .leaflet-popup-close-button{color:#94a3b8!important;z-index:2}`}</style>;
}
