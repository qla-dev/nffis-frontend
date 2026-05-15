export type FirefighterStationType = 'territorial' | 'volunteer' | 'industrial';
export type FirefighterLocationPrecision =
  | 'exact'
  | 'village-center'
  | 'facility-center'
  | 'municipality-seat';
export type FirefighterCapacitySource = 'reported' | 'estimated';

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

export function getStationSupervisor(
  station: Pick<FirefighterStation, 'stationType' | 'municipality'>,
  stations: readonly FirefighterStation[]
): string {
  if (station.stationType === 'territorial') {
    return RS_FIREFIGHTER_UNION.name;
  }
  const parent = stations.find(
    (entry) => entry.municipality === station.municipality && entry.stationType === 'territorial'
  );
  return parent?.name ?? RS_FIREFIGHTER_UNION.name;
}

interface BaseLocation {
  coordinates: [number, number];
  address: string;
  locationPrecision: FirefighterLocationPrecision;
}

const BASE_LOCATIONS: Record<string, BaseLocation> = {
  banjaLuka: {
    coordinates: [44.772085, 17.191765],
    address: 'Banja Luka, Grad Banja Luka, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  berkovici: {
    coordinates: [43.094527, 18.169143],
    address: 'Berkovići, Opština Berkovići, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  bijeljina: {
    coordinates: [44.756846, 19.215663],
    address: 'Bijeljina, Grad Bijeljina, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  bileca: {
    coordinates: [42.874851, 18.427977],
    address: 'Bileća, Opština Bileća, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  bratunac: {
    coordinates: [44.187111, 19.335226],
    address: 'Svetog Save, Moštanice, Bratunac, Republika Srpska, BiH',
    locationPrecision: 'exact',
  },
  brod: {
    coordinates: [45.146404, 17.999156],
    address: 'Brod, Opština Brod, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  rafinerijaBrod: {
    coordinates: [45.129519, 17.985221],
    address: 'Rafinerija nafte Brod, Rafinerijsko naselje, Brod, Republika Srpska, BiH',
    locationPrecision: 'facility-center',
  },
  cajnice: {
    coordinates: [43.556565, 19.072191],
    address: 'Čajniče, Opština Čajniče, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  celinac: {
    coordinates: [44.724173, 17.319359],
    address: 'Čelinac, Opština Čelinac, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  derventa: {
    coordinates: [44.976709, 17.906959],
    address: 'Derventa, Grad Derventa, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  doboj: {
    coordinates: [44.732456, 18.085016],
    address: 'Doboj, Grad Doboj, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  petrovac: {
    coordinates: [44.473393, 16.545247],
    address: 'Opština Petrovac, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  gacko: {
    coordinates: [43.166407, 18.535798],
    address: 'Gacko, Opština Gacko, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  riteGacko: {
    coordinates: [43.165005, 18.516433],
    address: 'RiTE Gacko, Rudo Polje, Gacko, Republika Srpska, BiH',
    locationPrecision: 'facility-center',
  },
  gradiska: {
    coordinates: [45.146195, 17.252075],
    address: 'Gradiška, Grad Gradiška, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  hanPijesak: {
    coordinates: [44.08129, 18.953064],
    address: 'Han Pijesak, Opština Han Pijesak, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  kalinovik: {
    coordinates: [43.504312, 18.446719],
    address: 'Kalinovik, Opština Kalinovik, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  knezevo: {
    coordinates: [44.489932, 17.380091],
    address: 'Kneževo, Opština Kneževo, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  kotorVaros: {
    coordinates: [44.620294, 17.37012],
    address: 'Kotor Varoš, Opština Kotor Varoš, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  kotorsko: {
    coordinates: [44.83438, 18.059035],
    address: 'Kotorsko, Grad Doboj, Republika Srpska, BiH',
    locationPrecision: 'village-center',
  },
  kozarac: {
    coordinates: [44.974457, 16.839624],
    address: 'Kozarac, Grad Prijedor, Republika Srpska, BiH',
    locationPrecision: 'village-center',
  },
  kostajnica: {
    coordinates: [45.218708, 16.546319],
    address: 'Kostajnica, Opština Kostajnica, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  kozarskaDubica: {
    coordinates: [45.18271, 16.808638],
    address: 'Kozarska Dubica, Opština Kozarska Dubica, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  krupaNaUni: {
    coordinates: [44.892176, 16.322966],
    address: 'Krupa na Uni, Opština Krupa na Uni, Republika Srpska, BiH',
    locationPrecision: 'village-center',
  },
  laktasi: {
    coordinates: [44.907466, 17.302289],
    address: 'Laktaši, Grad Laktaši, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  lastva: {
    coordinates: [42.700843, 18.475309],
    address: 'Lastva, Grad Trebinje, Republika Srpska, BiH',
    locationPrecision: 'village-center',
  },
  lopare: {
    coordinates: [44.63565, 18.844114],
    address: 'Lopare, Opština Lopare, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  ljubinje: {
    coordinates: [42.951543, 18.08992],
    address: 'Ljubinje, Opština Ljubinje, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  milici: {
    coordinates: [44.167939, 19.080063],
    address: 'Milići, Opština Milići, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  modrica: {
    coordinates: [44.956524, 18.301135],
    address: 'Modriča, Opština Modriča, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  mrkonjicGrad: {
    coordinates: [44.416602, 17.084259],
    address: 'Mrkonjić Grad, Opština Mrkonjić Grad, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  nevesinje: {
    coordinates: [43.258198, 18.106113],
    address: 'Nevesinje, Opština Nevesinje, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  istocnoSarajevo: {
    coordinates: [43.802399, 18.428845],
    address: 'Istočno Novo Sarajevo, Grad Istočno Sarajevo, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  potoci: {
    coordinates: [44.392728, 16.620194],
    address: 'Potoci, Opština Istočni Drvar, Republika Srpska, BiH',
    locationPrecision: 'village-center',
  },
  noviGrad: {
    coordinates: [45.048987, 16.37765],
    address: 'Novi Grad, Opština Novi Grad, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  novoGorazde: {
    coordinates: [43.648105, 19.036343],
    address: 'Novo Goražde, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  ostraLuka: {
    coordinates: [44.855036, 16.681484],
    address: 'Oštra Luka, Opština Oštra Luka, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  petrovo: {
    coordinates: [44.632599, 18.360981],
    address: 'Petrovo, Opština Petrovo, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  prijedor: {
    coordinates: [44.980137, 16.71237],
    address: 'Prijedor, Grad Prijedor, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  prnjavor: {
    coordinates: [44.868637, 17.663178],
    address: 'Prnjavor, Grad Prnjavor, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  pribinic: {
    coordinates: [44.601678, 17.687492],
    address: 'Pribinić, Grad Teslić, Republika Srpska, BiH',
    locationPrecision: 'village-center',
  },
  pelagicevo: {
    coordinates: [44.906424, 18.611912],
    address: 'Pelagićevo, Opština Pelagićevo, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  ribnik: {
    coordinates: [44.413239, 16.8149],
    address: 'Ribnik, Opština Ribnik, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  rogatica: {
    coordinates: [43.799737, 19.002206],
    address: 'Rogatica, Opština Rogatica, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  rudo: {
    coordinates: [43.617436, 19.365622],
    address: 'Rudo, Opština Rudo, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  srbac: {
    coordinates: [45.095444, 17.519859],
    address: 'Srbac, Opština Srbac, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  srebrenica: {
    coordinates: [44.106319, 19.295278],
    address: 'Srebrenica, Opština Srebrenica, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  foca: {
    coordinates: [43.505855, 18.774393],
    address: 'Foča, Opština Foča, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  samac: {
    coordinates: [45.060689, 18.469347],
    address: 'Šamac, Opština Šamac, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  sipovo: {
    coordinates: [44.280943, 17.085305],
    address: 'Šipovo, Opština Šipovo, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  teslic: {
    coordinates: [44.606576, 17.859506],
    address: 'Teslić, Grad Teslić, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  trebinje: {
    coordinates: [42.70983, 18.345726],
    address: 'Trebinje, Grad Trebinje, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  ugljevik: {
    coordinates: [44.693053, 18.994599],
    address: 'Ugljevik, Opština Ugljevik, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  riteUgljevik: {
    coordinates: [44.68392, 18.962195],
    address: 'Termoelektrana, Ugljevik, Republika Srpska, BiH',
    locationPrecision: 'facility-center',
  },
  visegrad: {
    coordinates: [43.786429, 19.294097],
    address: 'Višegrad, Opština Višegrad, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  vrbanja: {
    coordinates: [44.762616, 17.250876],
    address: 'Vrbanja, Banja Luka, Republika Srpska, BiH',
    locationPrecision: 'village-center',
  },
  zvornik: {
    coordinates: [44.385407, 19.102772],
    address: 'Zvornik, Grad Zvornik, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  jezero: {
    coordinates: [44.35001, 17.170955],
    address: 'Jezero, Opština Jezero, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  stanari: {
    coordinates: [44.751726, 17.837945],
    address: 'Stanari, Opština Stanari, Republika Srpska, BiH',
    locationPrecision: 'municipality-seat',
  },
  ocaus: {
    coordinates: [44.499109, 17.634506],
    address: 'Očauš, Republika Srpska, BiH',
    locationPrecision: 'village-center',
  },
};

function offsetCoordinates(
  coordinates: [number, number],
  latOffset: number,
  lngOffset: number
): [number, number] {
  return [
    Number((coordinates[0] + latOffset).toFixed(6)),
    Number((coordinates[1] + lngOffset).toFixed(6)),
  ];
}

function station(config: {
  id: string;
  name: string;
  stationType: FirefighterStationType;
  municipality: string;
  baseKey: keyof typeof BASE_LOCATIONS;
  address?: string;
  capacity: number;
  capacitySource?: FirefighterCapacitySource;
  phone?: string;
  phoneAlt?: string;
  mobile?: string;
  email?: string;
  postalCode?: string;
  vehicleCount?: number;
  supervisor?: string;
  note?: string;
  latOffset?: number;
  lngOffset?: number;
}): FirefighterStation {
  const base = BASE_LOCATIONS[config.baseKey];
  return {
    id: config.id,
    name: config.name,
    stationType: config.stationType,
    municipality: config.municipality,
    coordinates:
      config.latOffset || config.lngOffset
        ? offsetCoordinates(base.coordinates, config.latOffset ?? 0, config.lngOffset ?? 0)
        : base.coordinates,
    address: config.address ?? base.address,
    phone: config.phone ?? 'N/A',
    phoneAlt: config.phoneAlt,
    mobile: config.mobile,
    email: config.email,
    postalCode: config.postalCode,
    capacity: config.capacity,
    vehicleCount: config.vehicleCount,
    supervisor: config.supervisor ?? '',
    capacitySource: config.capacitySource ?? 'estimated',
    locationPrecision: base.locationPrecision,
    note: config.note,
  };
}

function finalizeStations(stations: FirefighterStation[]): readonly FirefighterStation[] {
  return stations.map((entry) => ({
    ...entry,
    supervisor: entry.supervisor || getStationSupervisor(entry, stations),
  }));
}

const FIREFIGHTER_STATION_DRAFTS: FirefighterStation[] = [
  station({ id: 'tvsj-banja-luka', name: 'TVSJ Banja Luka', stationType: 'territorial', municipality: 'Banja Luka', baseKey: 'banjaLuka', capacity: 88, capacitySource: 'reported', address: 'Hvarska bb, Banja Luka 78000, Republika Srpska, BiH', note: 'Capacity aligned with the 2018 RS public-sector audit.', postalCode: '78000', phone: '051/233-910', phoneAlt: '051/233-941', mobile: '066/802-278', email: 'miroslav.malinic@banjaluka.rs.ba', vehicleCount: 18 }),
  station({ id: 'vd-banja-luka', name: 'VD Banja Luka', stationType: 'volunteer', municipality: 'Banja Luka', baseKey: 'banjaLuka', capacity: 12, postalCode: '78000', phone: '051/211-790', mobile: '065/639-713', email: 'vatrogasnodrustvo@blic.net', latOffset: 0.01, lngOffset: 0.01 }),
  station({ id: 'vd-berkovici', name: 'VD Berkovići', stationType: 'volunteer', municipality: 'Berkovići', baseKey: 'berkovici', capacity: 12, postalCode: '88363', phone: '059/860-015', phoneAlt: '059/860-155', mobile: '065/692-711', email: 'opstinaberkovici@gmail.com' }),
  station({ id: 'tvsj-bijeljina', name: 'TVSJ Bijeljina', stationType: 'territorial', municipality: 'Bijeljina', baseKey: 'bijeljina', capacity: 36, postalCode: '75300', phone: '055/212-837', mobile: '065/661-140', email: 'milespasojevic64@gmail.com' }),
  station({ id: 'tvsj-bileca', name: 'TVSJ Bileća', stationType: 'territorial', municipality: 'Bileća', baseKey: 'bileca', capacity: 12, postalCode: '89230', phone: '059/370-796', phoneAlt: '059/370-951', mobile: '065/986-344', email: 'vatrogasno.bileca@gmail.com' }),
  station({ id: 'tvsj-bratunac', name: 'TVSJ Bratunac', stationType: 'territorial', municipality: 'Bratunac', baseKey: 'bratunac', capacity: 12, postalCode: '75420', phone: '056/410-047', mobile: '065/356-621', email: 'tvj.bratunac@gmail.com', vehicleCount: 7 }),
  station({ id: 'vd-cajnice', name: 'VD Čajniče', stationType: 'volunteer', municipality: 'Čajniče', baseKey: 'cajnice', capacity: 12, postalCode: '73280', phone: '058/315-039', mobile: '066/972-343', email: 'mcokorilo@gmail.com' }),
  station({ id: 'vd-celinac', name: 'VD Čelinac', stationType: 'volunteer', municipality: 'Čelinac', baseKey: 'celinac', capacity: 12, postalCode: '78240', phone: '051/551-440', phoneAlt: '051/551-013', mobile: '065/734-638', email: 'vdcelinac2005@gmail.com' }),
  station({ id: 'tvsj-derventa', name: 'TVSJ Derventa', stationType: 'territorial', municipality: 'Derventa', baseKey: 'derventa', capacity: 18, postalCode: '74400', phone: '053/333-461', mobile: '065/568-928', email: 'tvj.der@gmail.com', vehicleCount: 20 }),
  station({ id: 'tvsj-doboj', name: 'TVSJ Doboj', stationType: 'territorial', municipality: 'Doboj', baseKey: 'doboj', capacity: 30, postalCode: '74101', phone: '053/200-731', mobile: '066/887-229', email: 'tvjdoboj@gmail.com', vehicleCount: 20 }),
  station({ id: 'dvd-drinic-petrovac', name: 'DVD Drinić-Petrovac', stationType: 'volunteer', municipality: 'Petrovac', baseKey: 'petrovac', capacity: 12, postalCode: '74101', mobile: '065/524-349', email: 'dvd.doboj@gmail.com', vehicleCount: 12 }),
  station({ id: 'tvsj-brod', name: 'TVSJ Brod', stationType: 'territorial', municipality: 'Brod', baseKey: 'brod', capacity: 12, postalCode: '79290', phone: '050/465-002', mobile: '065/429-506', email: 'tvjbrod@opstina-brod.net', vehicleCount: 16 }),
  station({ id: 'pvsj-brod-rafinerija', name: 'PVSJ Brod (Rafinerija nafte Brod)', stationType: 'industrial', municipality: 'Brod', baseKey: 'rafinerijaBrod', capacity: 10, postalCode: '74450', phone: '053/612-050', mobile: '066/110-023', email: 'tvjbrod@opstina-brod.net' }),
  station({ id: 'tvsj-gacko', name: 'TVSJ Gacko', stationType: 'territorial', municipality: 'Gacko', baseKey: 'gacko', capacity: 16, postalCode: '74450', phone: '053/612-155', mobile: '065/266-875', email: 'panicdusko@rafinerija.com', vehicleCount: 7 }),
  station({ id: 'pvsj-gacko-rite', name: 'PVSJ Gacko (RiTE Gacko)', stationType: 'industrial', municipality: 'Gacko', baseKey: 'riteGacko', capacity: 10, postalCode: '89240', phone: '059/472-123', phoneAlt: '059/472-602', mobile: '065/310-837', email: 'vatrogasnajedinicagacko@gmail.com' }),
  station({ id: 'tvsj-gradiska', name: 'TVSJ Gradiška', stationType: 'territorial', municipality: 'Gradiška', baseKey: 'gradiska', capacity: 20, postalCode: '89240', mobile: '066/120-183', email: 'Petar.nikolic@ritegacko.com', vehicleCount: 38 }),
  station({ id: 'tvsj-han-pijesak', name: 'TVSJ Han Pijesak', stationType: 'territorial', municipality: 'Han Pijesak', baseKey: 'hanPijesak', capacity: 12, postalCode: '78400', phone: '051/814-754', mobile: '065/580-639', email: 'pvjgradiska@gmail.com' }),
  station({ id: 'dvd-kalinovik', name: 'DVD Kalinovik', stationType: 'volunteer', municipality: 'Kalinovik', baseKey: 'kalinovik', capacity: 12, postalCode: '71360', phone: '057/557-753', phoneAlt: '057/559-299', mobile: '066/246-496', email: 'tvjhanpijesak@gmail.com', vehicleCount: 27 }),
  station({ id: 'dvj-knezevo', name: 'DVJ Kneževo', stationType: 'volunteer', municipality: 'Kneževo', baseKey: 'knezevo', capacity: 12, postalCode: '71230', phone: '057/623-335', mobile: '066/195-562', email: 'goran.visnjevac@hotmail.com' }),
  station({ id: 'tvsj-kotor-varos', name: 'TVSJ Kotor Varoš', stationType: 'territorial', municipality: 'Kotor Varoš', baseKey: 'kotorVaros', capacity: 12, postalCode: '78230', phone: '051/591-737', phoneAlt: '051/591-601', mobile: '065/724-924', email: 'gmilovan62@gmail.com' }),
  station({ id: 'dvd-kotorsko', name: 'DVD Kotorsko', stationType: 'volunteer', municipality: 'Doboj', baseKey: 'kotorsko', capacity: 8, postalCode: '78220', phone: '051/785-104', mobile: '065/327-881', email: 'danijel.rastik@gmail.com' }),
  station({ id: 'vd-kozarac', name: 'VD Kozarac', stationType: 'volunteer', municipality: 'Prijedor', baseKey: 'kozarac', capacity: 8, postalCode: '79202', phone: '052/344-469', mobile: '065/379-965', email: 'vdkozarac@gmail.com' }),
  station({ id: 'dvd-kostajnica', name: 'DVD Kostajnica', stationType: 'volunteer', municipality: 'Kostajnica', baseKey: 'kostajnica', capacity: 12, postalCode: '79224', phone: '052/663-099', phoneAlt: '052/663-553', mobile: '065/894-624', email: 'glusicasinisa@gmail.com' }),
  station({ id: 'tvsj-kozarska-dubica', name: 'TVSJ Kozarska Dubica', stationType: 'territorial', municipality: 'Kozarska Dubica', baseKey: 'kozarskaDubica', capacity: 12, postalCode: '79240', phone: '052/424-301', phoneAlt: '052/424-302', mobile: '065/606-303', email: 'tvsj.kozarskadubica@gmail.com' }),
  station({ id: 'dvd-krupa-na-uni', name: 'DVD Krupa na Uni', stationType: 'volunteer', municipality: 'Krupa na Uni', baseKey: 'krupaNaUni', capacity: 12, postalCode: '79227', phone: '052/480-835', mobile: '066/032-493', email: 'nacelnik.knu@teol.net', vehicleCount: 25 }),
  station({ id: 'tvsj-laktasi', name: 'TVSJ Laktaši', stationType: 'territorial', municipality: 'Laktaši', baseKey: 'laktasi', capacity: 16, postalCode: '78250', phone: '051/532-399', mobile: '065/578-579', email: 'dvdlaktasi@yahoo.com', vehicleCount: 28 }),
  station({ id: 'vd-lastva', name: 'VD Lastva', stationType: 'volunteer', municipality: 'Trebinje', baseKey: 'lastva', capacity: 8, postalCode: '89208', phone: '059/252-005', phoneAlt: '059/252-033', mobile: '066/258-541', email: 'vatrogasnajedinicalastvausce@gmail.com' }),
  station({ id: 'tvsj-lopare', name: 'TVSJ Lopare', stationType: 'territorial', municipality: 'Lopare', baseKey: 'lopare', capacity: 16, capacitySource: 'reported', note: 'Capacity aligned with the 2023 Lopare uniform procurement report.', postalCode: '75240', phone: '055/651-003', phoneAlt: '055/650-304', mobile: '065/679-232', email: 'jovotvj@gmail.com' }),
  station({ id: 'tvsj-ljubinje', name: 'TVSJ Ljubinje', stationType: 'territorial', municipality: 'Ljubinje', baseKey: 'ljubinje', capacity: 12, postalCode: '88380', phone: '059/621-641', mobile: '066/866-503', email: 'agencija059@gmail.com' }),
  station({ id: 'tvsj-milici', name: 'TVSJ Milići', stationType: 'territorial', municipality: 'Milići', baseKey: 'milici', capacity: 12, postalCode: '75446', phone: '056/741-607', mobile: '065/526-510', email: 'tvj.milici@opstinamilici.org', vehicleCount: 10 }),
  station({ id: 'tvsj-modrica', name: 'TVSJ Modriča', stationType: 'territorial', municipality: 'Modriča', baseKey: 'modrica', capacity: 16, postalCode: '74480', phone: '053/810-110', mobile: '065/524-773', email: 'tvjmodrica@gmail.com' }),
  station({ id: 'pvsj-modrica-rafinerija', name: 'PVSJ Modriča (Rafinerija ulja Modriča)', stationType: 'industrial', municipality: 'Modriča', baseKey: 'modrica', capacity: 10, postalCode: '74480', phone: '053/822-219', mobile: '066/704-939', email: 'nebojsa@modricaoil.com', latOffset: -0.01, lngOffset: 0.01 }),
  station({ id: 'vd-mrkonjic-grad', name: 'VD Mrkonjić Grad', stationType: 'volunteer', municipality: 'Mrkonjić Grad', baseKey: 'mrkonjicGrad', capacity: 12, postalCode: '70260', phone: '050/221-150', phoneAlt: '050/221-150', mobile: '065/864-403', email: 'vatrogasnodmg@teol.net' }),
  station({ id: 'tvsj-nevesinje', name: 'TVSJ Nevesinje', stationType: 'territorial', municipality: 'Nevesinje', baseKey: 'nevesinje', capacity: 12, postalCode: '88280', phone: '059/601-018', mobile: '065/337-198', email: 'm.jonlija@hotmail.com' }),
  station({ id: 'tvsj-istocno-sarajevo', name: 'TVSJ Istočno Sarajevo', stationType: 'territorial', municipality: 'Istočno Sarajevo', baseKey: 'istocnoSarajevo', capacity: 24, postalCode: '71420', phone: '057/340-734', phoneAlt: '050/482-877', mobile: '065/942-243', email: 'jupvj@hotmail.com', vehicleCount: 25 }),
  station({ id: 'dvd-istocni-drvar-potoci', name: 'DVD Istočni Drvar – Potoci', stationType: 'volunteer', municipality: 'Istočni Drvar', baseKey: 'potoci', capacity: 8, postalCode: '79220', phone: '052/752-330', mobile: '066/701-761', email: 'rajkoljaca@gmail.com' }),
  station({ id: 'tvsj-novi-grad', name: 'TVSJ Novi Grad', stationType: 'territorial', municipality: 'Novi Grad', baseKey: 'noviGrad', capacity: 14, postalCode: '73110', phone: '058/967-613', mobile: '066/903-453', email: 'vitomir.mastilo@gmail.com' }),
  station({ id: 'dvd-novo-gorazde', name: 'DVD Novo Goražde', stationType: 'volunteer', municipality: 'Novo Goražde', baseKey: 'novoGorazde', capacity: 12, postalCode: '75406', phone: '056/337-314', phoneAlt: '056/337-259', mobile: '065/853-310', email: 'miladin.vukicevc@gmail.com' }),
  station({ id: 'dvd-ostra-luka', name: 'DVD Oštra Luka', stationType: 'volunteer', municipality: 'Oštra Luka', baseKey: 'ostraLuka', capacity: 12, postalCode: '79263', phone: '052/337-200', mobile: '066/832-780', email: 'vatrogasnod.oluka@gmail.com' }),
  station({ id: 'dvsj-petrovo', name: 'DVSJ Petrovo', stationType: 'volunteer', municipality: 'Petrovo', baseKey: 'petrovo', capacity: 12, postalCode: '74225', mobile: '065/528-120', email: 'ptvjpetrovo@gmail.com', vehicleCount: 25 }),
  station({ id: 'tvsj-prijedor', name: 'TVSJ Prijedor', stationType: 'territorial', municipality: 'Prijedor', baseKey: 'prijedor', capacity: 28, postalCode: '74317', phone: '053/262-700', mobile: '065/548-584', email: 'miljus@vatrogasciprijedor.com', vehicleCount: 19 }),
  station({ id: 'tvsj-prnjavor', name: 'TVSJ Prnjavor', stationType: 'territorial', municipality: 'Prnjavor', baseKey: 'prnjavor', capacity: 16, postalCode: '79101', phone: '052/234-305', phoneAlt: '052/490-071', mobile: '065/689-938', email: 'miljus@vatrogasciprijedor.com' }),
  station({ id: 'vd-prnjavor', name: 'VD Prnjavor', stationType: 'volunteer', municipality: 'Prnjavor', baseKey: 'prnjavor', capacity: 12, postalCode: '78430', phone: '051/665-160', mobile: '065/261-053', email: 'prnjavorskivatrogasci@gmail.com', latOffset: 0.006, lngOffset: 0.008 }),
  station({ id: 'dvd-pribinic', name: 'DVD Pribinić', stationType: 'volunteer', municipality: 'Teslić', baseKey: 'pribinic', capacity: 8, postalCode: '78430', mobile: '065/759-693', email: 'vatrogasno.drustvo.prnjavor@gmail.com' }),
  station({ id: 'dvsj-pelagicevo', name: 'DVSJ Pelagićevo', stationType: 'volunteer', municipality: 'Pelagićevo', baseKey: 'pelagicevo', capacity: 12, postalCode: '74276', mobile: '066/804-213', email: 'dusanicdejan6@gmail.com' }),
  station({ id: 'dvd-ribnik', name: 'DVD Ribnik', stationType: 'volunteer', municipality: 'Ribnik', baseKey: 'ribnik', capacity: 12, postalCode: '76256', mobile: '065/710-191', email: 'vatrogasnodrustvoribnik@gmail.com' }),
  station({ id: 'tvsj-rogatica', name: 'TVSJ Rogatica', stationType: 'territorial', municipality: 'Rogatica', baseKey: 'rogatica', capacity: 12, postalCode: '76273', phone: '054/490-231', mobile: '065/615-565', email: 'tvjrogatica@gmail.com' }),
  station({ id: 'dvd-rudo', name: 'DVD Rudo', stationType: 'volunteer', municipality: 'Rudo', baseKey: 'rudo', capacity: 12, postalCode: '79288', phone: '050/430-070', mobile: '066/662-337', email: 'vatro10@teol.net' }),
  station({ id: 'tvsj-srbac', name: 'TVSJ Srbac', stationType: 'territorial', municipality: 'Srbac', baseKey: 'srbac', capacity: 12, postalCode: '73220', phone: '058/415-155', phoneAlt: '058/420-531', mobile: '065/594-149', vehicleCount: 18 }),
  station({ id: 'tvsj-srebrenica', name: 'TVSJ Srebrenica', stationType: 'territorial', municipality: 'Srebrenica', baseKey: 'srebrenica', capacity: 12, postalCode: '73260', phone: '058/711-168', email: 'vatro10@teol.net', vehicleCount: 34 }),
  station({ id: 'vd-foca', name: 'VD Foča', stationType: 'volunteer', municipality: 'Foča', baseKey: 'foca', capacity: 12, postalCode: '78420', phone: '051/740-372', mobile: '065/598-047', email: 'vatrogasnosr@teol.net', latOffset: 0.005, lngOffset: 0.008 }),
  station({ id: 'tvsj-foca', name: 'TVSJ Foča', stationType: 'territorial', municipality: 'Foča', baseKey: 'foca', capacity: 18, postalCode: '75430', phone: '056/440-833', mobile: '065/741-833', email: 'veliborn@gmail.com' }),
  station({ id: 'pvsj-drina-foca', name: 'PVSJ Drina-Foča (Kazneno popravni zavod Foča)', stationType: 'industrial', municipality: 'Foča', baseKey: 'foca', capacity: 10, postalCode: '73301', phone: '058/210-199', mobile: '065/370-995', email: 'vdfoca@yahoo.com', latOffset: -0.008, lngOffset: 0.012 }),
  station({ id: 'tvsj-samac', name: 'TVSJ Šamac', stationType: 'territorial', municipality: 'Šamac', baseKey: 'samac', capacity: 12, postalCode: '73301', phone: '058/213-613', mobile: '066/318-182', email: 'omegaslobo@gmail.com' }),
  station({ id: 'vd-sipovo', name: 'VD Šipovo', stationType: 'volunteer', municipality: 'Šipovo', baseKey: 'sipovo', capacity: 12, postalCode: '73301', phone: '058/210-892', mobile: '066/082-041', email: 'daremalis@gmail.com', vehicleCount: 11 }),
  station({ id: 'tvsj-teslic', name: 'TVSJ Teslić', stationType: 'territorial', municipality: 'Teslić', baseKey: 'teslic', capacity: 18, postalCode: '76230', phone: '054/612-284', mobile: '065/177-801', email: 'savo.buba71@gmail.com' }),
  station({ id: 'tvsj-trebinje', name: 'TVSJ Trebinje', stationType: 'territorial', municipality: 'Trebinje', baseKey: 'trebinje', capacity: 24, postalCode: '70270', phone: '050/371-448', mobile: '066/623-314', email: 'tvjtrebinje@gmail.com' }),
  station({ id: 'tvsj-ugljevik', name: 'TVSJ Ugljevik', stationType: 'territorial', municipality: 'Ugljevik', baseKey: 'ugljevik', capacity: 31, capacitySource: 'reported', note: 'Capacity aligned with the 2025 Skala Radio interview.', postalCode: '74270', phone: '053/431-669', mobile: '065/901-417', email: 'vatrogasnajedinicaugljevik@gmail.com', vehicleCount: 18 }),
  station({ id: 'pvsj-ugljevik-rite', name: 'PVSJ Ugljevik (RiTE Ugljevik)', stationType: 'industrial', municipality: 'Ugljevik', baseKey: 'riteUgljevik', capacity: 10, postalCode: '89101', phone: '059/223-886', mobile: '066/801-184', email: 'sretens@live.com' }),
  station({ id: 'tvj-visegrad', name: 'TVJ Višegrad', stationType: 'territorial', municipality: 'Višegrad', baseKey: 'visegrad', capacity: 12, postalCode: '76330', phone: '055/773-850', phoneAlt: '055/772-336', mobile: '065/980-763', email: 'vatrogasnajedinicaugljevik@gmail.com' }),
  station({ id: 'vd-vrbanja', name: 'VD Vrbanja', stationType: 'volunteer', municipality: 'Banja Luka', baseKey: 'vrbanja', capacity: 8, postalCode: '76330', phone: '055/774-291', phoneAlt: '055/771-516', mobile: '065/428-560', email: 'sretens@live.com' }),
  station({ id: 'tvsj-zvornik', name: 'TVSJ Zvornik', stationType: 'territorial', municipality: 'Zvornik', baseKey: 'zvornik', capacity: 24, postalCode: '73240', phone: '058/620-323', phoneAlt: '058/620-323', mobile: '065/970-100', email: 'slajko.pvj@gmail.com', vehicleCount: 14 }),
  station({ id: 'vd-jezero', name: 'VD Jezero', stationType: 'volunteer', municipality: 'Jezero', baseKey: 'jezero', capacity: 12, postalCode: '75440', phone: '056/734-860', phoneAlt: '056/734-830', mobile: '065/404-948', email: 'tomicpero4@gmail.com' }),
  station({ id: 'tvsj-stanari', name: 'TVSJ Stanari', stationType: 'territorial', municipality: 'Stanari', baseKey: 'stanari', capacity: 12, postalCode: '78211', phone: '051/423-317', mobile: '065/659-103', email: 'vatrogasci_vrbanja@hotmail.com' }),
  station({ id: 'vd-ocaus', name: 'VD Očauš', stationType: 'volunteer', municipality: 'Teslić', baseKey: 'ocaus', capacity: 8, postalCode: '75400', phone: '056/210-133', phoneAlt: '050/291-001', mobile: '066/725-625', email: 'slajko.pvj@gmail.com' }),
];

export const FIREFIGHTER_STATIONS: readonly FirefighterStation[] = finalizeStations(
  FIREFIGHTER_STATION_DRAFTS
);
