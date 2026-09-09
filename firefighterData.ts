export type FirefighterStationType = 'territorial' | 'volunteer' | 'industrial' | 'unknown';
export type FirefighterLocationPrecision =
  | 'exact'
  | 'village-center'
  | 'facility-center'
  | 'municipality-seat';
export type FirefighterCapacitySource = 'reported' | 'estimated' | 'unknown';

/** Runtime records are loaded from the PostGIS firefighter_stations layer. */
export interface FirefighterStation {
  id: string;
  name: string;
  stationType: FirefighterStationType;
  municipality: string;
  coordinates: [number, number];
  address: string;
  phone: string;
  phoneAlt?: string;
  mobile?: string;
  email?: string;
  postalCode?: string;
  capacity: number;
  vehicleCount?: number;
  supervisor: string;
  capacitySource: FirefighterCapacitySource;
  locationPrecision: FirefighterLocationPrecision;
  note?: string;
}

export const RS_FIREFIGHTER_UNION = {
  name: 'Savez vatrogasnih organizacija RS',
  address: 'Bulevar srpske vojske 3-5, Banja Luka 78000',
  phone: '051/219-588',
  email: 'sekretar.vsrs@gmail.com',
  website: 'www.vatrogasnisavezrs.com',
} as const;
