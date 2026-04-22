import React from 'react';
import { Circle, CircleMarker, LayerGroup, Popup } from 'react-leaflet';
import { Flame, Wind } from 'lucide-react';
import { IncidentReport } from '../../../types';

interface ActiveFireHotspotsLayerProps {
  incidents: IncidentReport[];
  visible: boolean;
}

const getFireStyle = (urgency: IncidentReport['urgency']) => {
  if (urgency === 'high') {
    return {
      markerRadius: 8,
      glowRadius: 14000,
      color: '#ef4444',
      fillColor: '#fb923c',
      fillOpacity: 0.95,
      glowOpacity: 0.28,
    };
  }

  if (urgency === 'medium') {
    return {
      markerRadius: 7,
      glowRadius: 9500,
      color: '#f97316',
      fillColor: '#facc15',
      fillOpacity: 0.88,
      glowOpacity: 0.22,
    };
  }

  return {
    markerRadius: 6,
    glowRadius: 7000,
    color: '#f59e0b',
    fillColor: '#fde047',
    fillOpacity: 0.82,
    glowOpacity: 0.18,
  };
};

export const ActiveFireHotspotsLayer: React.FC<ActiveFireHotspotsLayerProps> = ({
  incidents,
  visible,
}) => {
  if (!visible || incidents.length === 0) {
    return null;
  }

  return (
    <LayerGroup>
      {incidents.map((incident) => {
        const style = getFireStyle(incident.urgency);
        const position: [number, number] = [incident.lat, incident.lng];

        return (
          <React.Fragment key={incident.id}>
            <Circle
              center={position}
              radius={style.glowRadius}
              pathOptions={{
                color: style.color,
                weight: 0,
                fillColor: style.color,
                fillOpacity: style.glowOpacity,
              }}
            />
            <CircleMarker
              center={position}
              radius={style.markerRadius}
              pathOptions={{
                color: '#fff7ed',
                weight: 2,
                fillColor: style.fillColor,
                fillOpacity: style.fillOpacity,
              }}
            >
              <Popup offset={[0, -8]}>
                <div className="min-w-[220px] space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-red-100 p-2 text-red-600">
                      <Flame size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900">Active Fire Hotspot</div>
                      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        {incident.urgency} priority
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-700">
                    <div>{incident.description}</div>
                    <div>
                      Lat: {incident.lat.toFixed(4)} | Lng: {incident.lng.toFixed(4)}
                    </div>
                    <div>{new Date(incident.timestamp).toLocaleString()}</div>
                  </div>

                  {(incident.windSpeed || incident.windDirection) && (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                      <Wind size={14} />
                      <span>
                        {incident.windDirection ?? '--'}° @ {incident.windSpeed ?? '--'} km/h
                      </span>
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          </React.Fragment>
        );
      })}
    </LayerGroup>
  );
};
