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
  capacity: number;
  capacitySource: FirefighterCapacitySource;
  locationPrecision: FirefighterLocationPrecision;
  note?: string;
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
    capacity: config.capacity,
    capacitySource: config.capacitySource ?? 'estimated',
    locationPrecision: base.locationPrecision,
    note: config.note,
  };
}

export const FIREFIGHTER_STATIONS: readonly FirefighterStation[] = [
  station({ id: 'tvsj-banja-luka', name: 'TVSJ Banja Luka', stationType: 'territorial', municipality: 'Banja Luka', baseKey: 'banjaLuka', address: 'Hvarska bb, Banja Luka 78000, Republika Srpska, BiH', capacity: 88, capacitySource: 'reported', phone: '051 233-920', note: 'Capacity aligned with the 2018 RS public-sector audit.' }),
  station({ id: 'vd-banja-luka', name: 'VD Banja Luka', stationType: 'volunteer', municipality: 'Banja Luka', baseKey: 'banjaLuka', capacity: 12, latOffset: 0.01, lngOffset: 0.01 }),
  station({ id: 'vd-berkovici', name: 'VD Berkovići', stationType: 'volunteer', municipality: 'Berkovići', baseKey: 'berkovici', capacity: 12 }),
  station({ id: 'tvsj-bijeljina', name: 'TVSJ Bijeljina', stationType: 'territorial', municipality: 'Bijeljina', baseKey: 'bijeljina', capacity: 36 }),
  station({ id: 'tvsj-bileca', name: 'TVSJ Bileća', stationType: 'territorial', municipality: 'Bileća', baseKey: 'bileca', capacity: 12 }),
  station({ id: 'tvsj-bratunac', name: 'TVSJ Bratunac', stationType: 'territorial', municipality: 'Bratunac', baseKey: 'bratunac', capacity: 12 }),
  station({ id: 'vd-cajnice', name: 'VD Čajniče', stationType: 'volunteer', municipality: 'Čajniče', baseKey: 'cajnice', capacity: 12 }),
  station({ id: 'vd-celinac', name: 'VD Čelinac', stationType: 'volunteer', municipality: 'Čelinac', baseKey: 'celinac', capacity: 12 }),
  station({ id: 'tvsj-derventa', name: 'TVSJ Derventa', stationType: 'territorial', municipality: 'Derventa', baseKey: 'derventa', capacity: 18 }),
  station({ id: 'tvsj-doboj', name: 'TVSJ Doboj', stationType: 'territorial', municipality: 'Doboj', baseKey: 'doboj', capacity: 30 }),
  station({ id: 'dvd-drinic-petrovac', name: 'DVD Drinić-Petrovac', stationType: 'volunteer', municipality: 'Petrovac', baseKey: 'petrovac', capacity: 12 }),
  station({ id: 'tvsj-brod', name: 'TVSJ Brod', stationType: 'territorial', municipality: 'Brod', baseKey: 'brod', capacity: 12 }),
  station({ id: 'pvsj-brod-rafinerija', name: 'PVSJ Brod (Rafinerija nafte Brod)', stationType: 'industrial', municipality: 'Brod', baseKey: 'rafinerijaBrod', capacity: 10 }),
  station({ id: 'tvsj-gacko', name: 'TVSJ Gacko', stationType: 'territorial', municipality: 'Gacko', baseKey: 'gacko', capacity: 16 }),
  station({ id: 'pvsj-gacko-rite', name: 'PVSJ Gacko (RiTE Gacko)', stationType: 'industrial', municipality: 'Gacko', baseKey: 'riteGacko', capacity: 10 }),
  station({ id: 'tvsj-gradiska', name: 'TVSJ Gradiška', stationType: 'territorial', municipality: 'Gradiška', baseKey: 'gradiska', capacity: 20 }),
  station({ id: 'tvsj-han-pijesak', name: 'TVSJ Han Pijesak', stationType: 'territorial', municipality: 'Han Pijesak', baseKey: 'hanPijesak', capacity: 12 }),
  station({ id: 'dvd-kalinovik', name: 'DVD Kalinovik', stationType: 'volunteer', municipality: 'Kalinovik', baseKey: 'kalinovik', capacity: 12 }),
  station({ id: 'dvj-knezevo', name: 'DVJ Kneževo', stationType: 'volunteer', municipality: 'Kneževo', baseKey: 'knezevo', capacity: 12 }),
  station({ id: 'tvsj-kotor-varos', name: 'TVSJ Kotor Varoš', stationType: 'territorial', municipality: 'Kotor Varoš', baseKey: 'kotorVaros', capacity: 12 }),
  station({ id: 'dvd-kotorsko', name: 'DVD Kotorsko', stationType: 'volunteer', municipality: 'Doboj', baseKey: 'kotorsko', capacity: 8 }),
  station({ id: 'vd-kozarac', name: 'VD Kozarac', stationType: 'volunteer', municipality: 'Prijedor', baseKey: 'kozarac', capacity: 8 }),
  station({ id: 'dvd-kostajnica', name: 'DVD Kostajnica', stationType: 'volunteer', municipality: 'Kostajnica', baseKey: 'kostajnica', capacity: 12 }),
  station({ id: 'tvsj-kozarska-dubica', name: 'TVSJ Kozarska Dubica', stationType: 'territorial', municipality: 'Kozarska Dubica', baseKey: 'kozarskaDubica', capacity: 12 }),
  station({ id: 'dvd-krupa-na-uni', name: 'DVD Krupa na Uni', stationType: 'volunteer', municipality: 'Krupa na Uni', baseKey: 'krupaNaUni', capacity: 12 }),
  station({ id: 'tvsj-laktasi', name: 'TVSJ Laktaši', stationType: 'territorial', municipality: 'Laktaši', baseKey: 'laktasi', capacity: 16 }),
  station({ id: 'vd-lastva', name: 'VD Lastva', stationType: 'volunteer', municipality: 'Trebinje', baseKey: 'lastva', capacity: 8 }),
  station({ id: 'tvsj-lopare', name: 'TVSJ Lopare', stationType: 'territorial', municipality: 'Lopare', baseKey: 'lopare', capacity: 16, capacitySource: 'reported', note: 'Capacity aligned with the 2023 Lopare uniform procurement report.' }),
  station({ id: 'tvsj-ljubinje', name: 'TVSJ Ljubinje', stationType: 'territorial', municipality: 'Ljubinje', baseKey: 'ljubinje', capacity: 12 }),
  station({ id: 'tvsj-milici', name: 'TVSJ Milići', stationType: 'territorial', municipality: 'Milići', baseKey: 'milici', capacity: 12 }),
  station({ id: 'tvsj-modrica', name: 'TVSJ Modriča', stationType: 'territorial', municipality: 'Modriča', baseKey: 'modrica', capacity: 16 }),
  station({ id: 'pvsj-modrica-rafinerija', name: 'PVSJ Modriča (Rafinerija ulja Modriča)', stationType: 'industrial', municipality: 'Modriča', baseKey: 'modrica', capacity: 10, latOffset: -0.01, lngOffset: 0.01 }),
  station({ id: 'vd-mrkonjic-grad', name: 'VD Mrkonjić Grad', stationType: 'volunteer', municipality: 'Mrkonjić Grad', baseKey: 'mrkonjicGrad', capacity: 12 }),
  station({ id: 'tvsj-nevesinje', name: 'TVSJ Nevesinje', stationType: 'territorial', municipality: 'Nevesinje', baseKey: 'nevesinje', capacity: 12 }),
  station({ id: 'tvsj-istocno-sarajevo', name: 'TVSJ Istočno Sarajevo', stationType: 'territorial', municipality: 'Istočno Sarajevo', baseKey: 'istocnoSarajevo', capacity: 24 }),
  station({ id: 'dvd-istocni-drvar-potoci', name: 'DVD Istočni Drvar – Potoci', stationType: 'volunteer', municipality: 'Istočni Drvar', baseKey: 'potoci', capacity: 8 }),
  station({ id: 'tvsj-novi-grad', name: 'TVSJ Novi Grad', stationType: 'territorial', municipality: 'Novi Grad', baseKey: 'noviGrad', capacity: 14 }),
  station({ id: 'dvd-novo-gorazde', name: 'DVD Novo Goražde', stationType: 'volunteer', municipality: 'Novo Goražde', baseKey: 'novoGorazde', capacity: 12 }),
  station({ id: 'dvd-ostra-luka', name: 'DVD Oštra Luka', stationType: 'volunteer', municipality: 'Oštra Luka', baseKey: 'ostraLuka', capacity: 12 }),
  station({ id: 'dvsj-petrovo', name: 'DVSJ Petrovo', stationType: 'volunteer', municipality: 'Petrovo', baseKey: 'petrovo', capacity: 12 }),
  station({ id: 'tvsj-prijedor', name: 'TVSJ Prijedor', stationType: 'territorial', municipality: 'Prijedor', baseKey: 'prijedor', capacity: 28 }),
  station({ id: 'tvsj-prnjavor', name: 'TVSJ Prnjavor', stationType: 'territorial', municipality: 'Prnjavor', baseKey: 'prnjavor', capacity: 16 }),
  station({ id: 'vd-prnjavor', name: 'VD Prnjavor', stationType: 'volunteer', municipality: 'Prnjavor', baseKey: 'prnjavor', capacity: 12, latOffset: 0.006, lngOffset: 0.008 }),
  station({ id: 'dvd-pribinic', name: 'DVD Pribinić', stationType: 'volunteer', municipality: 'Teslić', baseKey: 'pribinic', capacity: 8 }),
  station({ id: 'dvsj-pelagicevo', name: 'DVSJ Pelagićevo', stationType: 'volunteer', municipality: 'Pelagićevo', baseKey: 'pelagicevo', capacity: 12 }),
  station({ id: 'dvd-ribnik', name: 'DVD Ribnik', stationType: 'volunteer', municipality: 'Ribnik', baseKey: 'ribnik', capacity: 12 }),
  station({ id: 'tvsj-rogatica', name: 'TVSJ Rogatica', stationType: 'territorial', municipality: 'Rogatica', baseKey: 'rogatica', capacity: 12 }),
  station({ id: 'dvd-rudo', name: 'DVD Rudo', stationType: 'volunteer', municipality: 'Rudo', baseKey: 'rudo', capacity: 12 }),
  station({ id: 'tvsj-srbac', name: 'TVSJ Srbac', stationType: 'territorial', municipality: 'Srbac', baseKey: 'srbac', capacity: 12 }),
  station({ id: 'tvsj-srebrenica', name: 'TVSJ Srebrenica', stationType: 'territorial', municipality: 'Srebrenica', baseKey: 'srebrenica', capacity: 12 }),
  station({ id: 'vd-foca', name: 'VD Foča', stationType: 'volunteer', municipality: 'Foča', baseKey: 'foca', capacity: 12, latOffset: 0.005, lngOffset: 0.008 }),
  station({ id: 'tvsj-foca', name: 'TVSJ Foča', stationType: 'territorial', municipality: 'Foča', baseKey: 'foca', capacity: 18 }),
  station({ id: 'pvsj-drina-foca', name: 'PVSJ Drina-Foča (Kazneno popravni zavod Foča)', stationType: 'industrial', municipality: 'Foča', baseKey: 'foca', capacity: 10, latOffset: -0.008, lngOffset: 0.012 }),
  station({ id: 'tvsj-samac', name: 'TVSJ Šamac', stationType: 'territorial', municipality: 'Šamac', baseKey: 'samac', capacity: 12 }),
  station({ id: 'vd-sipovo', name: 'VD Šipovo', stationType: 'volunteer', municipality: 'Šipovo', baseKey: 'sipovo', capacity: 12 }),
  station({ id: 'tvsj-teslic', name: 'TVSJ Teslić', stationType: 'territorial', municipality: 'Teslić', baseKey: 'teslic', capacity: 18 }),
  station({ id: 'tvsj-trebinje', name: 'TVSJ Trebinje', stationType: 'territorial', municipality: 'Trebinje', baseKey: 'trebinje', capacity: 24 }),
  station({ id: 'tvsj-ugljevik', name: 'TVSJ Ugljevik', stationType: 'territorial', municipality: 'Ugljevik', baseKey: 'ugljevik', capacity: 31, capacitySource: 'reported', note: 'Capacity aligned with the 2025 Skala Radio interview.' }),
  station({ id: 'pvsj-ugljevik-rite', name: 'PVSJ Ugljevik (RiTE Ugljevik)', stationType: 'industrial', municipality: 'Ugljevik', baseKey: 'riteUgljevik', capacity: 10 }),
  station({ id: 'tvj-visegrad', name: 'TVJ Višegrad', stationType: 'territorial', municipality: 'Višegrad', baseKey: 'visegrad', capacity: 12 }),
  station({ id: 'vd-vrbanja', name: 'VD Vrbanja', stationType: 'volunteer', municipality: 'Banja Luka', baseKey: 'vrbanja', capacity: 8 }),
  station({ id: 'tvsj-zvornik', name: 'TVSJ Zvornik', stationType: 'territorial', municipality: 'Zvornik', baseKey: 'zvornik', capacity: 24 }),
  station({ id: 'vd-jezero', name: 'VD Jezero', stationType: 'volunteer', municipality: 'Jezero', baseKey: 'jezero', capacity: 12 }),
  station({ id: 'tvsj-stanari', name: 'TVSJ Stanari', stationType: 'territorial', municipality: 'Stanari', baseKey: 'stanari', capacity: 12 }),
  station({ id: 'vd-ocaus', name: 'VD Očauš', stationType: 'volunteer', municipality: 'Teslić', baseKey: 'ocaus', capacity: 8 }),
] as const;
