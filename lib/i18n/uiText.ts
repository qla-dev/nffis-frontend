import { Language } from '../../types';

/**
 * Bosnian translations for screens written with English literals (FC_PDR14).
 * `tr('English text')` returns the Bosnian text when the UI language is BS and
 * falls back to the English original for every other language or missing key.
 */
const BS: Record<string, string> = {
  // Navigation and shell
  'Fire monitoring': 'Praćenje požara',
  'Fires': 'Požari',
  'Upload AWS data': 'Učitaj AWS podatke',
  'Sign out': 'Odjava',
  'User administration': 'Administracija korisnika',

  // Operational fire dashboard
  'Active events': 'Aktivni događaji',
  'New in 1 hour': 'Novo u 1 satu',
  'New in 24 hours': 'Novo u 24 sata',
  'High priority': 'Visok prioritet',
  'Extinguished (24h)': 'Ugašeno (24 h)',
  'Highest current FRP': 'Najveći trenutni FRP',
  'Event': 'Događaj',
  'Location': 'Lokacija',
  'Source': 'Izvor',
  'Reports': 'Prijave',
  'Suggested response': 'Preporučeni odgovor',
  'Last seen / reported': 'Zadnje viđeno / prijavljeno',
  'Operational status': 'Operativni status',
  'Loading fire monitoring...': 'Učitavanje praćenja požara...',
  'Fire monitoring unavailable.': 'Praćenje požara nije dostupno.',
  'Interpretation:': 'Tumačenje:',
  'Fuel class help': 'Pomoć za klase goriva',
  'Close fuel-class help': 'Zatvori pomoć za klase goriva',
  'BiH fuel-class catalogue': 'Katalog klasa goriva BiH',
  'FireWatch events and incident reports': 'FireWatch događaji i prijave incidenata',
  'Reported fire': 'Prijavljen požar',
  'Reported location': 'Prijavljena lokacija',
  'Incident reports': 'Prijave incidenata',
  'Satellite': 'Satelit',
  'Verify first': 'Prvo provjeriti',
  'No fire alerts.': 'Nema upozorenja o požarima.',
  'Review note:': 'Napomena pregleda:',
  'Alerts': 'Upozorenja',
  'satellite detections and public incident reports are grouped when they are within 3.5 km and 8 hours. They are not automatically confirmed fires.':
    'satelitske detekcije i prijave građana grupišu se kad su unutar 3,5 km i 8 sati. To nisu automatski potvrđeni požari.',
  'blocking gaps': 'blokirajućih nedostataka',
  'Missing:': 'Nedostaje:',
  'Day': 'Dan',
  'Pyretechnics-compatible proxy classes derived from ESA WorldCover. These descriptions support review; they are not local institutional approval.':
    'Proxy klase kompatibilne s Pyretechnics, izvedene iz ESA WorldCover. Opisi služe za pregled i nisu lokalno institucionalno odobrenje.',

  // Response readiness
  'Response readiness': 'Spremnost za odgovor',
  'Building response-readiness preview...': 'Priprema pregleda spremnosti za odgovor...',
  'Live preview · not saved': 'Pregled uživo · nije sačuvano',
  'Mapped road': 'Kartirana cesta',
  'Water source': 'Izvor vode',
  'Unavailable': 'Nedostupno',
  'Ranked stations': 'Rangirane stanice',
  'No verified station coordinates available.': 'Nema provjerenih koordinata stanica.',
  'Staging screening point': 'Tačka za okupljanje (provjera)',
  'Save new plan snapshot': 'Sačuvaj novu verziju plana',
  'Required review evidence or operational note': 'Obavezan dokaz pregleda ili operativna napomena',
  'Approve': 'Odobri',
  'Reject': 'Odbij',

  // Fire intelligence overview
  'National coverage · advisory': 'Državna pokrivenost · savjetodavno',
  'Bosnia and Herzegovina Fire Intelligence': 'Analitika požara Bosne i Hercegovine',
  'Inputs ready': 'Ulazni podaci spremni',
  'Loading BiH intelligence...': 'Učitavanje analitike za BiH...',
  'Today': 'Danas',
  'No product': 'Nema proizvoda',
  'EFFIS Europe scale': 'EFFIS evropska skala',
  'Build provisional BiH fuel model': 'Izradi privremeni model goriva BiH',
  'All entries begin as': 'Svi unosi počinju kao',
  'Awaiting institutional review': 'Čeka institucionalni pregled',
  'Approve entries and sign': 'Odobri unose i potpiši',
  'Evidence/reviewer note required': 'Obavezna napomena / dokaz recenzenta',
  'Final approval requires separate Forestry Service and Civil Protection sign-offs.': 'Konačno odobrenje traži odvojene potpise šumarske službe i civilne zaštite.',
  'Approved BiH FWI COG · today': 'Odobreni FWI COG za BiH · danas',
  'Download COG': 'Preuzmi COG',
  'No evidence note': 'Nema napomene o dokazu',

  // Fire event detail drawer
  'Fire incident details': 'Detalji požara',
  'Close': 'Zatvori',
  'Loading event...': 'Učitavanje događaja...',
  'Loading...': 'Učitavanje...',
  'Status': 'Status',
  'Priority': 'Prioritet',
  'Coordinates': 'Koordinate',
  'Confidence': 'Pouzdanost',
  'Peak / latest FRP': 'Najveći / zadnji FRP',
  'Sources': 'Izvori',
  'Nearest road': 'Najbliža cesta',
  'Forest / protected area': 'Šuma / zaštićeno područje',
  'Forest composition': 'Sastav šume',
  'Land cover': 'Zemljišni pokrov',
  'Protected areas': 'Zaštićena područja',
  'Potential exposure': 'Potencijalna izloženost',
  'Potentially exposed': 'Potencijalno izloženo',
  'Operational case': 'Operativni slučaj',
  'Response workflow': 'Tok odgovora',
  'Assign to me': 'Dodijeli meni',
  'Operational note': 'Operativna napomena',
  'Verification, resources, access or command note': 'Napomena o provjeri, resursima, pristupu ili komandi',
  'Save update': 'Sačuvaj izmjenu',
  'Operations': 'Operacije',
  'Operational audit': 'Operativni zapis',
  'Satellite lifecycle': 'Satelitski životni ciklus',
  'No activity recorded.': 'Nema zabilježenih aktivnosti.',
  'Unassigned': 'Nije dodijeljeno',
  'Unknown': 'Nepoznato',
  'Unresolved': 'Neriješeno',
  'Reporter': 'Prijavio',
  'System': 'Sistem',
  'Field report': 'Terenska prijava',
  'Fire Intelligence': 'Analitika požara',
  'Advisory intelligence.': 'Savjetodavna analitika.',
  'These products never change incident status, dispatch resources, or issue public warnings.': 'Ovi proizvodi nikad ne mijenjaju status incidenta, ne upućuju resurse i ne izdaju javna upozorenja.',
  'Fire Intelligence is available only within Bosnia and Herzegovina.': 'Analitika požara dostupna je samo unutar Bosne i Hercegovine.',
  'Verified perimeter and version history': 'Provjereni perimetar i historija verzija',
  'Paste GeoJSON Polygon or MultiPolygon': 'Zalijepite GeoJSON Polygon ili MultiPolygon',
  'Add perimeter version': 'Dodaj verziju perimetra',
  'No perimeter versions.': 'Nema verzija perimetra.',
  'Perimeter saved for review.': 'Perimetar sačuvan za pregled.',
  'Perimeter approved.': 'Perimetar odobren.',
  'Perimeter rejected.': 'Perimetar odbijen.',
  'Sentinel-2 burn severity': 'Sentinel-2 intenzitet opožarenosti',
  'Run severity assessment': 'Pokreni procjenu intenziteta',
  'Severity assessment queued.': 'Procjena intenziteta je u redu čekanja.',
  'No assessments.': 'Nema procjena.',
  'Assessment approved.': 'Procjena odobrena.',
  'Assessment rejected.': 'Procjena odbijena.',
  'Assessment pending. Run the fire GIS enrichment backfill for older events.': 'Procjena na čekanju. Za starije događaje pokrenite GIS dopunu podataka.',
  'Impact records': 'Zapisi o uticaju',
  'Recovery observations': 'Opažanja oporavka',
  'Pyretechnics spread scenarios': 'Pyretechnics scenariji širenja',
  'Run Pyretechnics test scenario': 'Pokreni Pyretechnics testni scenarij',
  'No Pyretechnics scenarios yet.': 'Još nema Pyretechnics scenarija.',
  'Arrival-time COG': 'COG vremena dolaska',
  'Perimeters GeoJSON': 'Perimetri GeoJSON',
};

let current: Language = Language.EN;

export function setUiLanguage(language: Language): void {
  current = language;
}

export function tr(english: string): string {
  return current === Language.BS ? BS[english] ?? english : english;
}

export function hasBosnianTranslation(english: string): boolean {
  return english in BS;
}
