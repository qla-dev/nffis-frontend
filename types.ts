

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
  WIND_SPEED = 'Wind Dynamics',
  TERRAIN = 'Terrain',
  FIRE_RISK = 'Fire Risk',
  FLOOD_RISK = 'Flood Risk',
  VEGETATION = 'Vegetation',
  COUNTRY_BORDERS = 'Country Borders'
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