
import React, { useState, useEffect } from 'react';
import { 
  X, Send, MapPin, Loader2, AlertCircle, Wind, Droplets, Thermometer, 
  Eye, Cloud, Sun, Moon, Umbrella, Navigation, Calendar, Clock, 
  AlertTriangle, Gauge, ArrowRight 
} from 'lucide-react';
import { IncidentType, Language, OpenMeteoResponse } from '../../types';
import { TRANSLATIONS } from '../../constants';
import { analyzeIncidentUrgency } from '../../services/geminiService';
import { CloudRain, Snowflake, CloudLightning } from 'lucide-react';

interface ReportModalProps {
  language: Language;
  location: { lat: number; lng: number } | null;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

// Helper to map WMO codes to icons/labels
const getWeatherInfo = (code: number) => {
    const codes: Record<number, { label: string; icon: any }> = {
      0: { label: 'Clear Sky', icon: Sun },
      1: { label: 'Mainly Clear', icon: Sun },
      2: { label: 'Partly Cloudy', icon: Cloud },
      3: { label: 'Overcast', icon: Cloud },
      45: { label: 'Fog', icon: Cloud },
      48: { label: 'Depositing Rime Fog', icon: Cloud },
      51: { label: 'Light Drizzle', icon: CloudRain },
      53: { label: 'Moderate Drizzle', icon: CloudRain },
      55: { label: 'Dense Drizzle', icon: CloudRain },
      56: { label: 'Light Freezing Drizzle', icon: Snowflake },
      57: { label: 'Dense Freezing Drizzle', icon: Snowflake },
      61: { label: 'Slight Rain', icon: CloudRain },
      63: { label: 'Moderate Rain', icon: CloudRain },
      65: { label: 'Heavy Rain', icon: CloudRain },
      66: { label: 'Light Freezing Rain', icon: Snowflake },
      67: { label: 'Heavy Freezing Rain', icon: Snowflake },
      71: { label: 'Slight Snow', icon: Snowflake },
      73: { label: 'Moderate Snow', icon: Snowflake },
      75: { label: 'Heavy Snow', icon: Snowflake },
      77: { label: 'Snow Grains', icon: Snowflake },
      80: { label: 'Slight Rain Showers', icon: CloudRain },
      81: { label: 'Moderate Rain Showers', icon: CloudRain },
      82: { label: 'Violent Rain Showers', icon: CloudRain },
      85: { label: 'Slight Snow Showers', icon: Snowflake },
      86: { label: 'Heavy Snow Showers', icon: Snowflake },
      95: { label: 'Thunderstorm', icon: CloudLightning },
      96: { label: 'Thunderstorm with Hail', icon: CloudLightning },
      99: { label: 'Heavy Thunderstorm with Hail', icon: CloudLightning },
    };
    return codes[code] || { label: 'Unknown', icon: Cloud };
};

export const ReportModal: React.FC<ReportModalProps> = ({ language, location, onClose, onSubmit }) => {
  const t = TRANSLATIONS[language];
  const [type, setType] = useState<IncidentType>(IncidentType.FIRE);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Weather Data State
  const [weather, setWeather] = useState<OpenMeteoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location) {
      setLoading(true);
      setError(null);
      
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,pressure_msl,surface_pressure,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=auto`;

      fetch(url)
        .then(async (res) => {
          if (!res.ok) {
             throw new Error('Weather service unavailable');
          }
          const data = await res.json();
          setWeather(data);
        })
        .catch((err) => {
          console.error("Open-Meteo Error:", err);
          setError("Failed to retrieve environmental data.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;

    setIsSubmitting(true);
    // Use AI to analyze the report for urgency and environmental context
    const aiResult = await analyzeIncidentUrgency(description, type);
    
    // Simulate extraction delay
    setTimeout(() => {
      onSubmit({
        type,
        description,
        lat: location.lat,
        lng: location.lng,
        urgency: aiResult.urgency as any,
        windDirection: weather?.current.wind_direction_10m || 0,
        windSpeed: weather?.current.wind_speed_10m || 0 
      });
      setIsSubmitting(false);
    }, 1500);
  };

  // Helper functions for formatting
  const fmtTime = (isoString: string) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtDay = (isoString: string) => new Date(isoString).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  // Get current hour index
  const getCurrentHourIndex = (w: OpenMeteoResponse) => {
    if (!w.hourly.time.length) return -1;

    // Stay aligned with the timezone used by the API response itself.
    const currentHourStr = w.current.time.slice(0, 13); // YYYY-MM-DDTHH
    const exactHourIndex = w.hourly.time.findIndex(t => t.startsWith(currentHourStr));

    if (exactHourIndex !== -1) {
      return exactHourIndex;
    }

    const nextAvailableIndex = w.hourly.time.findIndex(t => t >= w.current.time);
    return nextAvailableIndex !== -1 ? nextAvailableIndex : 0;
  };

  if (!location) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col animate-in fade-in duration-300">
      
      {/* 1. TOP BAR */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                <MapPin className="text-white" size={24} />
            </div>
            <div>
                <h1 className="text-white font-bold text-xl leading-none">INCIDENT REPORTING PROTOCOL</h1>
                <div className="text-slate-400 text-xs font-mono mt-1 flex items-center gap-2">
                    <span className="text-blue-400">LAT: {location.lat.toFixed(5)}</span>
                    <span className="text-slate-700">|</span>
                    <span className="text-blue-400">LNG: {location.lng.toFixed(5)}</span>
                    <span className="text-slate-700">|</span>
                    <span className="text-emerald-500 font-bold uppercase">{weather?.timezone || "SYNCING..."}</span>
                </div>
            </div>
        </div>
        <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-all hover:rotate-90 duration-300"
        >
            <X size={32} />
        </button>
      </header>

      {/* 2. MAIN CONTENT GRID */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        
        {/* LEFT PANE: Weather Dashboard */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-950/50 scrollbar-thin scrollbar-thumb-slate-800">
            
            {loading ? (
                <div className="h-full flex items-center justify-center flex-col gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Cloud className="text-blue-500 animate-pulse" size={20} />
                        </div>
                    </div>
                    <p className="text-blue-400 font-mono text-sm tracking-[0.2em] animate-pulse">ACQUIRING TELEMETRY...</p>
                </div>
            ) : error ? (
                <div className="h-full flex items-center justify-center flex-col gap-4">
                    <AlertTriangle className="text-red-500" size={64} />
                    <p className="text-red-400 font-bold text-lg">{error}</p>
                    <button onClick={onClose} className="text-slate-500 hover:text-white underline">Return to Map</button>
                </div>
            ) : weather && (
                <div className="space-y-6 max-w-6xl mx-auto">
                    
                    {/* CURRENT CONDITIONS CARD */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Main Temp & Status */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>
                            
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Current Conditions</div>
                                    <div className="text-white text-5xl font-black tracking-tighter">
                                        {Math.round(weather.current.temperature_2m)}°
                                    </div>
                                    <div className="text-blue-400 font-medium text-lg mt-1 capitalize flex items-center gap-2">
                                        {getWeatherInfo(weather.current.weather_code).label}
                                        {React.createElement(getWeatherInfo(weather.current.weather_code).icon, { size: 24 })}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-slate-500 text-xs font-bold uppercase">Feels Like</div>
                                    <div className="text-slate-200 text-xl font-bold">{Math.round(weather.current.apparent_temperature)}°</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
                                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 flex items-center gap-3">
                                    <Wind className="text-cyan-400" size={20} />
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">Wind</div>
                                        <div className="text-white font-bold text-sm">{weather.current.wind_speed_10m} km/h</div>
                                        <div className="text-[10px] text-slate-600 flex items-center gap-1">
                                            <Navigation size={10} style={{ transform: `rotate(${weather.current.wind_direction_10m}deg)` }} />
                                            {weather.current.wind_direction_10m}°
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 flex items-center gap-3">
                                    <Droplets className="text-blue-400" size={20} />
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">Humidity</div>
                                        <div className="text-white font-bold text-sm">{weather.current.relative_humidity_2m}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-[10px] uppercase font-bold tracking-wider">Pressure</span>
                                    <Gauge size={16} />
                                </div>
                                <div className="text-2xl font-mono text-white">{Math.round(weather.current.pressure_msl)} <span className="text-sm text-slate-600">hPa</span></div>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-[10px] uppercase font-bold tracking-wider">Precipitation</span>
                                    <Umbrella size={16} className={weather.current.precipitation > 0 ? 'text-blue-500' : 'text-slate-500'} />
                                </div>
                                <div className="text-2xl font-mono text-white">{weather.current.precipitation} <span className="text-sm text-slate-600">mm</span></div>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-[10px] uppercase font-bold tracking-wider">Cloud Cover</span>
                                    <Cloud size={16} />
                                </div>
                                <div className="text-2xl font-mono text-white">{weather.current.cloud_cover} <span className="text-sm text-slate-600">%</span></div>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-slate-500 mb-2">
                                    <span className="text-[10px] uppercase font-bold tracking-wider">Wind Gusts</span>
                                    <Wind size={16} />
                                </div>
                                <div className="text-2xl font-mono text-white">{weather.current.wind_gusts_10m} <span className="text-sm text-slate-600">km/h</span></div>
                            </div>
                        </div>
                    </div>

                    {/* HOURLY FORECAST */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Clock size={14} /> 24-Hour Trend
                        </h3>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-slate-700">
                             {(() => {
                                const startIdx = getCurrentHourIndex(weather);
                                if (startIdx === -1) return null;
                                return weather.hourly.time.slice(startIdx, startIdx + 24).map((timeStr, i) => {
                                    const actualIndex = startIdx + i;
                                    const temp = weather.hourly.temperature_2m[actualIndex];
                                    const code = weather.hourly.weather_code[actualIndex];
                                    const pop = weather.hourly.precipitation_probability[actualIndex];
                                    const wInfo = getWeatherInfo(code);
                                    
                                    return (
                                        <div key={i} className="flex-shrink-0 w-20 flex flex-col items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                                            <span className="text-[10px] font-bold text-slate-500">{i === 0 ? 'Now' : fmtTime(timeStr)}</span>
                                            <wInfo.icon size={24} className="text-white" />
                                            <span className="text-xl font-bold text-white">{Math.round(temp)}°</span>
                                            <div className="w-full text-center">
                                                <div className="text-[9px] font-bold text-blue-400 flex items-center justify-center gap-1">
                                                    <Droplets size={8} /> {pop}%
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    {/* DAILY FORECAST */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                         <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Calendar size={14} /> 7-Day Outlook
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {weather.daily.time.map((timeStr, i) => {
                                const code = weather.daily.weather_code[i];
                                const max = weather.daily.temperature_2m_max[i];
                                const min = weather.daily.temperature_2m_min[i];
                                const prob = weather.daily.precipitation_probability_max[i];
                                const wInfo = getWeatherInfo(code);

                                return (
                                    <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between hover:border-slate-600 transition-colors">
                                        <div>
                                            <p className="text-sm font-bold text-white">{i === 0 ? 'Today' : fmtDay(timeStr)}</p>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">{wInfo.label}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                             <wInfo.icon size={24} className="text-white" />
                                             <div className="text-right">
                                                 <div className="text-sm font-bold text-white">{Math.round(max)}°</div>
                                                 <div className="text-xs text-slate-500">{Math.round(min)}°</div>
                                             </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            )}
        </div>

        {/* RIGHT PANE: Reporting Form */}
        <div className="w-full lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-20">
            <div className="p-6 border-b border-slate-800">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                    <AlertCircle className="text-red-500" />
                    Submit Incident
                </h2>
                <p className="text-slate-400 text-xs mt-2">
                    Please provide accurate details. Environmental data will be automatically attached to your report.
                </p>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
                
                {/* Incident Type Selection */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Incident Type</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setType(IncidentType.FIRE)}
                            className={`p-4 rounded-xl font-bold flex flex-col items-center gap-2 border-2 transition-all ${
                                type === IncidentType.FIRE 
                                ? 'border-red-500 bg-red-500/10 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
                                : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700'
                            }`}
                        >
                            <span className="text-2xl">🔥</span>
                            <span>Wildfire</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setType(IncidentType.FLOOD)}
                            className={`p-4 rounded-xl font-bold flex flex-col items-center gap-2 border-2 transition-all ${
                                type === IncidentType.FLOOD 
                                ? 'border-blue-500 bg-blue-500/10 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                                : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700'
                            }`}
                        >
                            <span className="text-2xl">🌊</span>
                            <span>Flooding</span>
                        </button>
                    </div>
                </div>

                {/* Description Input */}
                <div className="space-y-3 flex-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Situation Report</label>
                    <textarea
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe visibility, smoke color, approximate size, and immediate threats..."
                        className="w-full h-full min-h-[200px] bg-slate-950 border-2 border-slate-800 rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-0 transition-colors resize-none"
                    />
                </div>

                {/* Auto-filled Data Preview */}
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Wind Vector</span>
                        <span className="text-white font-mono">{weather?.current.wind_direction_10m ?? 0}° @ {weather?.current.wind_speed_10m ?? 0} km/h</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Humidity / Dew</span>
                        <span className="text-white font-mono">{weather?.current.relative_humidity_2m ?? 0}%</span>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || !weather}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin" />
                            <span>PROCESSING INTELLIGENCE...</span>
                        </>
                    ) : (
                        <>
                            <Send size={20} />
                            <span>TRANSMIT REPORT</span>
                        </>
                    )}
                </button>

            </form>
        </div>
      </div>
    </div>
  );
};
