
export enum Language {
  EN = 'en',
  BS = 'bs',
  JA = 'ja'
}

export enum MapLayer {
  SATELLITE = 'Standard Satellite',
  SATELLITE_CLARITY = 'High Clarity (Esri)',
  SATELLITE_GOOGLE = 'Google High-Res',
  SENTINEL = 'Sentinel-2 Cloudless',
  INFRARED = 'Infrared (Vegetation)',
  METEOBLUE = 'Meteoblue Temperature',
  NASA_FIRMS = 'NASA FIRMS (Hotspots)',
  THERMAL = 'Thermal Infrared (LST)',
  WINDY = 'Windy.com (Dark GIS)',
  WEATHER_TEMP = 'Temperature Map',
  FOREST_TEMP = 'Forest Temp (Live)',
  WIND_SPEED = 'Wind Dynamics',
  TERRAIN = 'Terrain',
  FIRE_RISK = 'Fire Risk',
  FLOOD_RISK = 'Flood Risk',
  VEGETATION = 'Vegetation',
  FORESTS = 'Forest Inventory',
  LANDFILLS = 'Active Landfills',
  PROTECTED_AREAS = 'Protected Areas (Heatmap)',
  BIH_BORDERS = 'BiH State Borders'
}

export enum IncidentType {
  FIRE = 'FIRE',
  FLOOD = 'FLOOD'
}

export enum RegionType {
  DECIDUOUS = 'Deciduous Forests',
  CONIFEROUS = 'Coniferous Forests',
  MIXED = 'Mixed Forests',
  MAQUIS = 'Maquis',
  LOW_VEGETATION = 'Low Vegetation',
  LANDFILL = 'Anthropogenic Landfill'
}

export interface IncidentReport {
  id: string;
  type: IncidentType;
  lat: number;
  lng: number;
  description: string;
  timestamp: number;
  urgency: 'high' | 'medium' | 'low';
  windDirection?: number; // degrees
  windSpeed?: number; // km/h
}

export interface ForestRegion {
  id: string;
  name: string;
  type: RegionType;
  area: number; // in hectares
  riskScore: number; // 0-1
  coordinates: [number, number];
}

export interface AppState {
  language: Language;
  activeLayers: Set<MapLayer>;
  incidents: IncidentReport[];
  view: 'map' | 'reports' | 'stats' | 'info' | 'layers';
  isReporting: boolean;
  isDarkMode: boolean;
}

// --- Open-Meteo API Types ---

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: any;
  current: {
    time: string;
    interval: number;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    rain: number;
    showers: number;
    snowfall: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
  };
  hourly_units: any;
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    dew_point_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
    pressure_msl: number[];
    surface_pressure: number[];
    cloud_cover: number[];
    cloud_cover_low: number[];
    cloud_cover_mid: number[];
    cloud_cover_high: number[];
    visibility: number[];
    evapotranspiration: number[];
    et0_fao_evapotranspiration: number[];
    vapour_pressure_deficit: number[];
    wind_speed_10m: number[];
    wind_speed_80m: number[];
    wind_speed_120m: number[];
    wind_speed_180m: number[];
    wind_direction_10m: number[];
    wind_direction_80m: number[];
    wind_direction_120m: number[];
    wind_direction_180m: number[];
    wind_gusts_10m: number[];
    temperature_80m: number[];
    temperature_120m: number[];
    temperature_180m: number[];
    soil_temperature_0cm: number[];
    soil_temperature_6cm: number[];
    soil_temperature_18cm: number[];
    soil_temperature_54cm: number[];
    soil_moisture_0_to_1cm: number[];
    soil_moisture_1_to_3cm: number[];
    soil_moisture_3_to_9cm: number[];
    soil_moisture_9_to_27cm: number[];
    soil_moisture_27_to_81cm: number[];
    uv_index: number[];
  };
  daily_units: any;
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_sum: number[];
    rain_sum: number[];
    showers_sum: number[];
    snowfall_sum: number[];
    precipitation_hours: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    wind_gusts_10m_max: number[];
    wind_direction_10m_dominant: number[];
  };
}
