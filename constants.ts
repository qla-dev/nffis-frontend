import { ForestRegion, IncidentType, Language, IncidentReport, RegionType } from './types';

export const BIH_CENTER: [number, number] = [44.1, 17.9];

// Simplified GeoJSON for Bosnia and Herzegovina to ensure validity as the original was truncated.
export const BIH_GEOJSON: any = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Bosnia and Herzegovina" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [19.42135, 43.5434], [18.8469, 43.3202], [17.6854, 43.0056], [17.4208, 43.1877],
          [16.9453, 45.2453], [19.42135, 43.5434]
        ]]
      }
    }
  ]
};

export const TRANSLATIONS = {
  [Language.EN]: {
    appName: 'Forest Guard',
    map: 'Map',
    reports: 'Reports',
    stats: 'Statistics',
    layers: 'Layers',
    reportIncident: 'Report Incident',
    system: 'System',
    support: 'Support',
    fireAlert: 'Fire Alert',
    floodAlert: 'Flood Alert',
    description: 'Description',
    location: 'Location',
    submit: 'Submit Report',
    activeOperators: 'Active Operators',
    recentReports: 'Recent Reports',
    systemCoreData: 'System Core Data',
    activeLanguage: 'Active Language',
    surveillanceNetwork: 'Surveillance Network',
    status: 'Status',
    nominal: 'Nominal',
    tracking: 'Tracking',
    alerts: 'Alerts',
    theme: 'Theme',
    liveWindVector: 'Live Wind Vector',
    heatIndex: 'Heat Index',
    assetsRegions: 'Assets & Regions',
    dataOverlays: 'Data Overlays',
    systemConfig: 'System Config',
    gisLegend: 'GIS Legend',
    imagerySource: 'Imagery Source',
    vector: 'Vector',
    forestInventory: 'Forest Inventory',
    activeLandfills: 'Active Landfills',
    protectedAreas: 'Protected Areas',
    fireThreats: 'Fire Threats',
    hydrological: 'Hydrological',
    classLegend: 'Classification Legend',
    regionTypes: {
      [RegionType.DECIDUOUS]: 'Deciduous Forests',
      [RegionType.CONIFEROUS]: 'Coniferous Forests',
      [RegionType.MIXED]: 'Mixed Forests',
      [RegionType.MAQUIS]: 'Maquis',
      [RegionType.LOW_VEGETATION]: 'Low Vegetation',
      [RegionType.LANDFILL]: 'Anthropogenic Landfill'
    },
    popup: {
      dataSync: 'Data Sync',
      surfaceArea: 'Surface Area',
      live: 'Live',
      threatIndex: 'Threat Index'
    },
    legend: {
      activeFire: 'Active Fire',
      activeFlood: 'Active Flood',
      sensorStation: 'Sensor Station',
      liveData: 'Live Data'
    },
    forests: {
      'Kozara National Park': 'Kozara National Park',
      'Sutjeska National Park': 'Sutjeska National Park',
      'Bjelašnica Forest': 'Bjelašnica Forest',
      'Uborak Landfill': 'Uborak Landfill'
    }
  },
  [Language.BS]: {
    appName: 'Šumska Straža',
    map: 'Mapa',
    reports: 'Izvještaji',
    stats: 'Statistika',
    layers: 'Slojevi',
    reportIncident: 'Prijavi Incident',
    system: 'Sistem',
    support: 'Podrška',
    fireAlert: 'Požar',
    floodAlert: 'Poplava',
    description: 'Opis',
    location: 'Lokacija',
    submit: 'Pošalji Izvještaj',
    activeOperators: 'Aktivni Operateri',
    recentReports: 'Nedavni Izvještaji',
    systemCoreData: 'Sistemski Podaci',
    activeLanguage: 'Jezik',
    surveillanceNetwork: 'Mreža Nadzora',
    status: 'Status',
    nominal: 'Nominalan',
    tracking: 'Praćenje',
    alerts: 'Upozorenja',
    theme: 'Tema',
    liveWindVector: 'Vjetar Uživo',
    heatIndex: 'Toplotni Indeks',
    assetsRegions: 'Resursi i Regije',
    dataOverlays: 'Slojevi Podataka',
    systemConfig: 'Konfiguracija',
    gisLegend: 'GIS Legenda',
    imagerySource: 'Izvor Slika',
    vector: 'Vektor',
    forestInventory: 'Inventar Šuma',
    activeLandfills: 'Aktivne Deponije',
    protectedAreas: 'Zaštićena Područja',
    fireThreats: 'Opasnost od Požara',
    hydrological: 'Hidrologija',
    classLegend: 'Legenda Klasifikacije',
    regionTypes: {
      [RegionType.DECIDUOUS]: 'Listopadne Šume',
      [RegionType.CONIFEROUS]: 'Četinarske Šume',
      [RegionType.MIXED]: 'Mješovite Šume',
      [RegionType.MAQUIS]: 'Makija',
      [RegionType.LOW_VEGETATION]: 'Niska Vegetacija',
      [RegionType.LANDFILL]: 'Deponija'
    },
    popup: {
      dataSync: 'Sinhronizacija',
      surfaceArea: 'Površina',
      live: 'Uživo',
      threatIndex: 'Indeks Prijetnje'
    },
    legend: {
      activeFire: 'Aktivan Požar',
      activeFlood: 'Aktivna Poplava',
      sensorStation: 'Senzorska Stanica',
      liveData: 'Podaci Uživo'
    },
    forests: {
      'Kozara National Park': 'Nacionalni Park Kozara',
      'Sutjeska National Park': 'Nacionalni Park Sutjeska',
      'Bjelašnica Forest': 'Šuma Bjelašnica',
      'Uborak Landfill': 'Deponija Uborak'
    }
  },
  [Language.JA]: {
    appName: 'Forest Guard',
    map: '地図',
    reports: 'レポート',
    stats: '統計',
    layers: 'レイヤー',
    reportIncident: '事件を報告',
    system: 'システム',
    support: 'サポート',
    fireAlert: '火災警報',
    floodAlert: '洪水警報',
    description: '説明',
    location: '場所',
    submit: '送信',
    activeOperators: 'アクティブなオペレーター',
    recentReports: '最近のレポート',
    systemCoreData: 'システムコアデータ',
    activeLanguage: '言語',
    surveillanceNetwork: '監視ネットワーク',
    status: 'ステータス',
    nominal: '正常',
    tracking: '追跡中',
    alerts: 'アラート',
    theme: 'テーマ',
    liveWindVector: '風向ベクトル',
    heatIndex: '暑さ指数',
    assetsRegions: '資産と地域',
    dataOverlays: 'データオーバーレイ',
    systemConfig: 'システム設定',
    gisLegend: 'GIS凡例',
    imagerySource: '画像ソース',
    vector: 'ベクトル',
    forestInventory: '森林インベントリ',
    activeLandfills: '埋立地',
    protectedAreas: '保護地域',
    fireThreats: '火災の脅威',
    hydrological: '水文学',
    classLegend: '分類凡例',
    regionTypes: {
      [RegionType.DECIDUOUS]: '落葉樹林',
      [RegionType.CONIFEROUS]: '針葉樹林',
      [RegionType.MIXED]: '混交林',
      [RegionType.MAQUIS]: 'マキー',
      [RegionType.LOW_VEGETATION]: '低植生',
      [RegionType.LANDFILL]: '埋立地'
    },
    popup: {
      dataSync: 'データ同期',
      surfaceArea: '表面積',
      live: 'ライブ',
      threatIndex: '脅威指数'
    },
    legend: {
      activeFire: '火災',
      activeFlood: '洪水',
      sensorStation: 'センサー局',
      liveData: 'ライブデータ'
    },
    forests: {
      'Kozara National Park': 'コザラ国立公園',
      'Sutjeska National Park': 'スティエスカ国立公園',
      'Bjelašnica Forest': 'ビェラシュニツァの森',
      'Uborak Landfill': 'ウボラク埋立地'
    }
  }
};

export const INITIAL_INCIDENTS: IncidentReport[] = [
  {
    id: 'inc-001',
    type: IncidentType.FIRE,
    lat: 43.8563,
    lng: 18.4131,
    description: 'Smoke reported near Trebević peak, strong wind carrying it north.',
    timestamp: Date.now() - 3600000,
    urgency: 'high',
    windDirection: 180,
    windSpeed: 25
  },
  {
    id: 'inc-002',
    type: IncidentType.FLOOD,
    lat: 44.7722,
    lng: 17.1910,
    description: 'River Vrbas overflowing near Banja Luka center.',
    timestamp: Date.now() - 7200000,
    urgency: 'medium'
  }
];

export const MOCK_FORESTS: ForestRegion[] = [
  {
    id: 'reg-001',
    name: 'Kozara National Park',
    type: RegionType.CONIFEROUS,
    area: 3520,
    riskScore: 0.75,
    coordinates: [45.0083, 16.9036]
  },
  {
    id: 'reg-002',
    name: 'Sutjeska National Park',
    type: RegionType.MIXED,
    area: 17500,
    riskScore: 0.45,
    coordinates: [43.3369, 18.6872]
  },
  {
    id: 'reg-003',
    name: 'Bjelašnica Forest',
    type: RegionType.DECIDUOUS,
    area: 8400,
    riskScore: 0.3,
    coordinates: [43.7086, 18.2589]
  },
  {
    id: 'reg-004',
    name: 'Uborak Landfill',
    type: RegionType.LANDFILL,
    area: 120,
    riskScore: 0.95,
    coordinates: [43.3853, 17.8439]
  }
];

export const REGION_STYLES: Record<RegionType, { color: string; iconType: string }> = {
  [RegionType.DECIDUOUS]: { color: '#4ade80', iconType: 'tree' }, // green-400
  [RegionType.CONIFEROUS]: { color: '#15803d', iconType: 'pine' }, // green-700
  [RegionType.MIXED]: { color: '#84cc16', iconType: 'mixed' }, // lime-500
  [RegionType.MAQUIS]: { color: '#eab308', iconType: 'shrub' }, // yellow-500
  [RegionType.LOW_VEGETATION]: { color: '#facc15', iconType: 'sprout' }, // yellow-400
  [RegionType.LANDFILL]: { color: '#ef4444', iconType: 'trash' } // red-500
};

export const PROTECTED_AREAS_DATA = [
  {
    name: 'Una National Park',
    type: 'National Park',
    lat: 44.7358,
    lng: 16.0969,
    areaSqKm: 198,
    intensity: 0.9
  },
  {
    name: 'Blidinje Nature Park',
    type: 'Nature Park',
    lat: 43.6125,
    lng: 17.5144,
    areaSqKm: 358,
    intensity: 0.6
  }
];