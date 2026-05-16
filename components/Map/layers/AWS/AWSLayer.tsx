import React, { useEffect, useState } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { scrape, allFhmzStations, AnyStation, AWS_COORDINATES, ScrapedData } from '../../../../AWSData';

interface AWSLayerProps {
  language: string;
}

interface StationLoadingState {
  [stationName: string]: boolean;
}

export const AWSLayer: React.FC<AWSLayerProps> = ({ language }) => {
  const [data, setData] = useState<ScrapedData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stationLoading, setStationLoading] = useState<StationLoadingState>({});
  const map = useMap();

  const getStationName = (station: AnyStation): string => {
    return 'city' in station ? station.city : station.station;
  };

  const loadAllStationsAsync = async () => {
    setIsRefreshing(true);
    try {
      const scraped = await scrape();
      setData(scraped);
      
      // Clear individual loading states
      setStationLoading({});
    } catch (e) {
      console.error("Failed to scrape AWS data:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const refreshIndividualStation = async (stationName: string) => {
    setStationLoading(prev => ({ ...prev, [stationName]: true }));
    try {
      const scraped = await scrape();
      setData(prev => {
        if (!prev) return scraped;
        return {
          ...prev,
          scrapedAt: scraped.scrapedAt,
          precipitation: scraped.precipitation,
          agro: scraped.agro,
          meteo: scraped.meteo,
          airQuality: scraped.airQuality,
          all: scraped.all,
        };
      });
    } catch (e) {
      console.error(`Failed to refresh station ${stationName}:`, e);
    } finally {
      setStationLoading(prev => ({ ...prev, [stationName]: false }));
    }
  };

  useEffect(() => {
    loadAllStationsAsync();
  }, []);

  const stationsToRender = data ? data.all : allFhmzStations;

  useEffect(() => {
    const RefreshControl = L.Control.extend({
      options: { position: 'bottomright' },
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        container.innerHTML = `
          <button class="bg-slate-900/90 backdrop-blur text-slate-300 hover:text-white hover:bg-blue-600/20 px-3 py-2 rounded-xl border border-slate-700 shadow-2xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] transition-all m-4" style="pointer-events: auto;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-cw ${isRefreshing ? 'animate-spin' : ''}"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            ${isRefreshing ? 'SYNCING AWS...' : 'REFRESH AWS'}
          </button>
        `;
        
        container.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (!isRefreshing) loadAllStationsAsync();
        };

        return container;
      }
    });

    const control = new RefreshControl();
    map.addControl(control);

    return () => {
      map.removeControl(control);
    };
  }, [map, isRefreshing]);

  const getIconHtml = (station: AnyStation) => {
    const name = getStationName(station);
    const isLoading = stationLoading[name];
    const isMeteo = station.type === 'meteo';
    const isPrecip = station.type === 'precipitation';
    const isAgro = station.type === 'agro';
    
    let color = '#3b82f6';
    if (isMeteo) color = '#10b981';
    if (isAgro) color = '#eab308';
    if (isPrecip) color = '#06b6d4';
    
    const tempText = isLoading ? '...' : station.tempC !== null ? `${station.tempC}°` : '--';

    return `
      <div class="flex flex-col items-center justify-center relative -ml-4 -mt-4">
        <div class="w-8 h-8 rounded-full border-2 shadow-xl flex items-center justify-center bg-slate-950/90 ${isLoading ? 'animate-pulse' : ''}" style="border-color: ${color}; box-shadow: 0 0 10px ${color}40;">
          <span class="text-[11px] font-bold text-white">${tempText}</span>
        </div>
        <div class="bg-slate-950/90 text-white text-[9px] px-1.5 py-0.5 rounded-md mt-1 border border-slate-800 shadow-lg whitespace-nowrap font-bold tracking-wide">${name}</div>
      </div>
    `;
  };

  return (
    <>
      {stationsToRender.map((station, i) => {
        const name = getStationName(station);
        const coords = AWS_COORDINATES[name];
        const isLoading = stationLoading[name];
        
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
                  <div className="flex items-center gap-2">
                    {isLoading && (
                      <svg className="animate-spin w-4 h-4 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10" opacity="0.3" />
                        <path d="M12 2a10 10 0 0 1 10 10" />
                      </svg>
                    )}
                    <span className="text-[9px] font-bold px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">{station.time}</span>
                  </div>
                </div>
                <div className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">
                  {station.type.replace('_', ' ')} Station
                </div>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <svg className="animate-spin w-5 h-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10" opacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    <span className="ml-2 text-sm text-slate-400">Refreshing data...</span>
                  </div>
                ) : (
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
                )}
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
