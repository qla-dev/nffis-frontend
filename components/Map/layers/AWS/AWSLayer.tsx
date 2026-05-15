import React, { useEffect, useState } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { scrape, allFhmzStations, AnyStation, AWS_COORDINATES, ScrapedData } from '../../../../AWSData';

interface AWSLayerProps {
  language: string;
}

export const AWSLayer: React.FC<AWSLayerProps> = ({ language }) => {
  const [data, setData] = useState<ScrapedData | null>(null);
  const [loading, setLoading] = useState(false);
  const map = useMap();

  const loadData = async () => {
    setLoading(true);
    try {
      const scraped = await scrape();
      setData(scraped);
    } catch (e) {
      console.error("Failed to scrape AWS data:", e);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stationsToRender = data ? data.all : allFhmzStations;

  useEffect(() => {
    const RefreshControl = L.Control.extend({
      options: { position: 'bottomright' },
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.innerHTML = `
          <button class="bg-slate-900/90 backdrop-blur text-slate-300 hover:text-white hover:bg-blue-600/20 px-3 py-2 rounded-xl border border-slate-700 shadow-2xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] transition-all m-4" style="pointer-events: auto;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-cw ${loading ? 'animate-spin' : ''}"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            ${loading ? 'SYNCING AWS...' : 'REFRESH AWS'}
          </button>
        `;
        
        container.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (!loading) loadData();
        };

        return container;
      }
    });

    const control = new RefreshControl();
    map.addControl(control);

    return () => {
      map.removeControl(control);
    };
  }, [map, loading]);

  const getIconHtml = (station: AnyStation) => {
    const isMeteo = station.type === 'meteo';
    const isPrecip = station.type === 'precipitation';
    const isAgro = station.type === 'agro';
    
    let color = '#3b82f6';
    if (isMeteo) color = '#10b981';
    if (isAgro) color = '#eab308';
    if (isPrecip) color = '#06b6d4';
    
    const tempText = station.tempC !== null ? `${station.tempC}°` : '--';

    return `
      <div class="flex flex-col items-center justify-center relative -ml-4 -mt-4">
        <div class="w-8 h-8 rounded-full border-2 shadow-xl flex items-center justify-center bg-slate-950/90" style="border-color: ${color}; box-shadow: 0 0 10px ${color}40;">
          <span class="text-[11px] font-bold text-white">${tempText}</span>
        </div>
        <div class="bg-slate-950/90 text-white text-[9px] px-1.5 py-0.5 rounded-md mt-1 border border-slate-800 shadow-lg whitespace-nowrap font-bold tracking-wide">${'city' in station ? station.city : station.station}</div>
      </div>
    `;
  };

  return (
    <>
      {stationsToRender.map((station, i) => {
        const name = 'city' in station ? station.city : station.station;
        const coords = AWS_COORDINATES[name];
        
        if (!coords) return null;

        const icon = L.divIcon({
          html: getIconHtml(station),
          className: 'aws-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -20]
        });

        return (
          <Marker key={`${name}-${i}`} position={coords} icon={icon}>
            <Popup className="aws-popup bg-transparent border-none shadow-none">
              <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-700 rounded-xl p-4 min-w-[220px] text-white shadow-2xl font-sans">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-black text-lg leading-tight">{name}</h3>
                  <span className="text-[9px] font-bold px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">{station.time}</span>
                </div>
                <div className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
                  {station.type.replace('_', ' ')} Station
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {station.tempC !== null && (
                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800 flex flex-col">
                      <span className="text-[9px] text-slate-500 uppercase font-bold mb-1">Temperature</span>
                      <span className="font-mono text-emerald-400 font-bold">{station.tempC} °C</span>
                    </div>
                  )}
                  {station.humidityPct !== null && (
                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800 flex flex-col">
                      <span className="text-[9px] text-slate-500 uppercase font-bold mb-1">Humidity</span>
                      <span className="font-mono text-blue-400 font-bold">{station.humidityPct} %</span>
                    </div>
                  )}
                  {station.precipMm !== null && (
                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800 flex flex-col">
                      <span className="text-[9px] text-slate-500 uppercase font-bold mb-1">Precipitation</span>
                      <span className="font-mono text-cyan-400 font-bold">{station.precipMm} mm</span>
                    </div>
                  )}
                  {station.pressureHpa !== null && (
                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800 flex flex-col">
                      <span className="text-[9px] text-slate-500 uppercase font-bold mb-1">Pressure</span>
                      <span className="font-mono text-slate-300 font-bold">{station.pressureHpa} hPa</span>
                    </div>
                  )}
                  {station.windSpeedMs !== null && (
                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800 flex flex-col col-span-2">
                      <span className="text-[9px] text-slate-500 uppercase font-bold mb-1">Wind</span>
                      <span className="font-mono text-slate-300 font-bold">
                        {station.windSpeedMs} m/s {station.windDir ? `(${station.windDir})` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
      <style>{`
        .aws-popup .leaflet-popup-content-wrapper,
        .aws-popup .leaflet-popup-tip {
          background: transparent;
          box-shadow: none;
        }
        .aws-popup .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
      `}</style>
    </>
  );
};
