import { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import type L from 'leaflet';
import { fetchFireScenarioPerimeters, fetchFireScenarios, type FireEventProperties } from '../../../services/fireMonitoringService';

const HORIZON_COLORS: Record<number, string> = { 1: '#facc15', 3: '#f97316', 6: '#dc2626', 12: '#7f1d1d' };

export function PyretechnicsScenarioLayer({ visible, events, pane }: { visible: boolean; events: FireEventProperties[]; pane: string }) {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(null);
  useEffect(() => {
    if (!visible) { setData(null); return; }
    const controller = new AbortController();
    const candidates = events.filter(event => event.fire_intelligence?.eligible ?? (
      event.longitude >= 15.70 && event.longitude <= 19.70 && event.latitude >= 42.50 && event.latitude <= 45.35
    ));
    Promise.all(candidates.map(async event => {
      const scenarios = await fetchFireScenarios(event.id, controller.signal);
      const latest = scenarios.data.find(item => item.artifact_urls?.perimeters && ['review_required', 'approved'].includes(item.status));
      if (!latest) return [];
      const collection = await fetchFireScenarioPerimeters(event.id, latest.id, controller.signal);
      return collection.features.map(feature => ({ ...feature, properties: { ...(feature.properties || {}), fire_event_id: event.id, scenario_id: latest.id, test_mode: latest.settings.test_mode } }));
    })).then(groups => setData({ type: 'FeatureCollection', features: groups.flat() })).catch(error => { if (error.name !== 'AbortError') console.error('Unable to load Pyretechnics scenario layers.', error); });
    return () => controller.abort();
  }, [events, visible]);

  if (!visible || !data?.features.length) return null;
  return <GeoJSON key={data.features.map(feature => `${feature.properties?.scenario_id}-${feature.properties?.horizon_h}`).join('|')} data={data as any} pane={pane} style={feature => { const horizon = Number(feature?.properties?.horizon_h || 12); return { color: HORIZON_COLORS[horizon] || HORIZON_COLORS[12], fillColor: HORIZON_COLORS[horizon] || HORIZON_COLORS[12], weight: 1.5, opacity: .95, fillOpacity: .18 }; }} onEachFeature={(feature, layer: L.Layer) => { layer.bindTooltip(`Pyretechnics ${feature.properties?.horizon_h} h · scenario ${feature.properties?.scenario_id}${feature.properties?.test_mode ? ' · TEST' : ''}`); }} />;
}
