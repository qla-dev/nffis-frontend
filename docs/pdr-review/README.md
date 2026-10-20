# PDR modul — pregled noćnog rada (20.10.2026.)

Sve je urađeno lokalno na granama **`feature/pdr-module`** u oba repoa (`nffis-backend`, `nffis-frontend`).
Ništa nije pushano. Taskovi nisu uneseni na board `api.bosancica.ai:82`: iz ovog okruženja
konekcija se resetuje (vidi kraj dokumenta). Kompletna lista taskova je u [../PDR_GAP_TASKS.md](../PDR_GAP_TASKS.md).

## Kako pokrenuti lokalno

| Šta | Vrijednost |
|---|---|
| Backend | `php artisan serve --port=8001` sa `APP_ENV=pdrdev` (učitava `nffis-backend/.env.pdrdev`, lokalni fajl, nije u gitu) |
| Frontend | `npm run dev` → http://localhost:3000 (proxy na `127.0.0.1:8001` preko `.env.local`) |
| Baze | lokalni PostgreSQL 17: `nffis_pdr_dev`, `nffis_pdr_dev_datasets` (PostGIS). Tvoje postojeće `nffis*` baze nisu dirane. |
| Test baza | `nffis_pdr_test_datasets` za PostGIS testove |
| Demo podaci | `php artisan pdr:import-layers --bbox=18.25,43.78,18.55,43.92` (CLC 2018 s EEA + OSM ceste, objekti, zaštićena područja za šire Sarajevo) |
| Test korisnici | `pdr.admin` (super-admin), `pdr.operator` (Civilna zaštita, Uloga 2), `pdr.methodologist` (Šumarstvo, Uloga 3), `pdr.reader` (MoS, Uloga 5) |
| Lozinka | `PDR_DEV_PASSWORD` u `nffis-backend/.env.pdrdev` |
| Demo poligon | [fixtures/trebevic-perimeter.geojson](fixtures/trebevic-perimeter.geojson), [fixtures/trebevic-perimeter.kml](fixtures/trebevic-perimeter.kml) |
| Generisani izvještaj | `exports/PDR-2026-00001-approved.pdf` i `.json` (lokalno, nije u gitu) |

> Screenshotovi su u `screenshots/` (lokalno, izuzeti iz gita jer imaju ~7 MB).

**Prije početka:** početna mapa, bez PDR modula u navigaciji.

![prije](screenshots/00-before-map-home.png)

---

## Urađeni taskovi i postupak testiranja

### B1 — PDR izvještaj: entitet, workflow, uloge · B19 — PDR uloge
- Tabela `pdr_reports`, API `/api/pdr-reports` (lista, kreiranje, izmjena, brisanje nacrta, submit, review).
- Moduli: `pdr-reports` (Uloga 2 kreira, Uloga 5 samo čita **odobrene**) i `pdr-methodology` (Uloga 3 odobrava ili odbija).
- Princip četiri oka: autor ne može odobriti vlastiti izvještaj (osim super-admina).
- **Test:**
  1. Uloguj se kao `pdr.operator` i otvori http://localhost:3000/#/pdr → klikni **New report**.
  2. Završi wizard (vidi F1), pa klikni **Submit for methodological verification**.
  3. Uloguj se kao `pdr.methodologist` i otvori http://localhost:3000/#/pdr/1 → upiši napomenu → **Approve report**.
  4. Uloguj se kao `pdr.reader` i otvori http://localhost:3000/#/pdr: vidi se samo odobreni izvještaj, bez dugmadi za izmjenu.

| Metodolog: verifikacija | Odobreno | Čitalac: samo odobreni | Čitalac: detalj |
|---|---|---|---|
| ![](screenshots/13-methodologist-review-panel.png) | ![](screenshots/14-methodologist-approved.png) | ![](screenshots/15-reader-list-approved-only.png) | ![](screenshots/16-reader-readonly-detail.png) |

### B2 — Učitavanje i validacija perimetra (SHP/KML/KMZ/GeoJSON/crtanje)
- Parser za zipovani Shapefile (+`.prj`), KML, KMZ, GeoJSON i nacrtani poligon.
- Validacija:
  - automatski zatvara prstenove;
  - odbija samopresijecanje, rupe van vanjske granice, preklapanje dijelova, koordinate koje nisu lon/lat i poligone van BiH;
  - na PostGIS-u radi reprojekciju (`source_srid`, npr. 3908) i `ST_IsValid`;
  - geodetska površina u ha.
- **Test:** http://localhost:3000/#/pdr/1/step/2 → **Upload file** → `fixtures/trebevic-perimeter.geojson` → **Validate perimeter** → treba pisati *288,94 ha · 10 vertices* → **Save perimeter**.
  Probaj i `trebevic-perimeter.kml` i **Draw on map** (klikovi na mapi, minimalno 3 tačke).

![perimetar](screenshots/03-step2-perimeter-validated.png)

### B3/B4 — Klasifikacija opožarenog zemljišta (CLC 2018) i registar slojeva za analizu
- `config/pdr.php` eksplicitno navodi tabelu za svaki sloj (nema više pogađanja po imenu). Lokalni sloj visoke rezolucije se uključuje preko env varijable `PDR_LAND_COVER_TABLE`.
- CLC klase su grupisane po EU pravilima: privredne šume, poljoprivredno zemljište, niska vegetacija, ostalo.
- Površina klase je unija, pa se preklopljeni izvorni poligoni ne broje dvaput (PostGIS test to dokazuje, PDR1).
- **Test:** http://localhost:3000/#/pdr/1/step/5 → tabela *Burnt area by land cover*. Zbir klasa = 288,94 ha.

### B5/B6/B7 — Infrastruktura, zaštićena područja, stanovništvo
- Ceste (km po klasi) i objekti, unutar perimetra i u tampon zoni od 500 m (`PDR_EXPOSURE_BUFFER_M`).
- Zaštićena područja: ha po lokalitetu i % lokaliteta.
- Stanovništvo: stambeni objekti × 2,97 osobe (popis 2013). Metoda piše u izvještaju.

### B8 — Matrica ekonomskih koeficijenata (PDR2)
- Verzionisani setovi koeficijenata: nacrt → odobren → povučen. Uređuje ih samo Uloga 3.
- Stope su po EU grupi, s posebnim stopama po CLC klasi; za ceste po klasi, a prazno polje znači da se koristi zadana stopa.
- Seeder pravi v1 **nacrt sa ilustrativnim vrijednostima**. Metodološki tim mora unijeti stvarne stope.
- **Test:** uloguj se kao `pdr.methodologist` i otvori http://localhost:3000/#/pdr/coefficients → izmijeni stopu → **Save** → **Approve this version**. **New draft version** pravi v2.

| Nacrt v1 | Odobren v1 |
|---|---|
| ![](screenshots/07-coefficients-draft-v1.png) | ![](screenshots/08-coefficients-approved-v1.png) |

### B9 — Proračun štete (C1 < 2 min) · F2 — Vizualizacija rezultata
- `POST /pdr-reports/{id}/calculate`. Demo proračun traje **0,1–0,7 s**.
- Bez odobrenog seta koeficijenata šteta se ne prikazuje i piše zašto.
- **Test:** http://localhost:3000/#/pdr/1/step/5 → **Recalculate**.

| Bez odobrenih koeficijenata | Sa odobrenim koeficijentima (€1.362.143) |
|---|---|
| ![](screenshots/06-step5-calculation-no-approved-coefficients.png) | ![](screenshots/09-step5-calculation-with-damage.png) |

### F1 — PDR wizard (6 koraka)
Koraci: Incident → Perimetar → Metapodaci → Validacija → Proračun → Izvještaj. Svaki korak ima svoj URL.

Redoslijed URL-ova:
1. http://localhost:3000/#/pdr/new
2. http://localhost:3000/#/pdr/1/step/2
3. http://localhost:3000/#/pdr/1/step/3
4. http://localhost:3000/#/pdr/1/step/4
5. http://localhost:3000/#/pdr/1/step/5
6. http://localhost:3000/#/pdr/1/step/6

| 1 Incident | 3 Metapodaci | 4 Validacija | 6 Izvještaj |
|---|---|---|---|
| ![](screenshots/02-step1-incident.png) | ![](screenshots/04-step3-metadata.png) | ![](screenshots/05-step4-validation.png) | ![](screenshots/10-step6-report-before-submit.png) |

Poslije slanja operater vidi izvještaj samo za čitanje: ![](screenshots/11-operator-after-submit-readonly.png)

### F3 — Ekran metodološke verifikacije · F5/FC_PDR08 — lista i filteri
- Lista se filtrira po statusu i entitetu (FBiH, RS, Brčko distrikt, državni nivo).
- **Test:** http://localhost:3000/#/pdr → filter *Rejected*. Prazna lista treba pisati „No reports match…“.

![lista](screenshots/12-operator-list-with-report.png) ![filter](screenshots/01-pdr-list-filtered-empty.png)

### B11 / FC_PDR02 — ERCC izvještaj: dvojezični PDF + JSON s kartom
- `GET /api/pdr-reports/{id}/export.pdf` i `export.json` (shema `nffis-pdr-ercc/1.0`).
- PDF sadrži:
  - sve obavezne sekcije: događaj, karta, CLC, infrastruktura, stanovništvo, zaštićena područja, šteta, intervencija, tražena pomoć, kontakt i **izvori podataka** (PDR3);
  - SVG kartu perimetra preko CLC, cesta i zaštićenih područja.
- Dok izvještaj nije odobren, PDF ima vodeni žig NACRT.
- **Test:** http://localhost:3000/#/pdr/1 → **ERCC report (PDF)** / **ERCC data (JSON)**. Gotov primjer je u `exports/`.

![export dugmad](screenshots/19-reader-detail-export-buttons.png)

### FC_PDR12 — AOI statistika
- **Test:** http://localhost:3000/#/pdr/aoi → **Upload file** (`trebevic-perimeter.kml`) ili crtanje na mapi → **Calculate statistics**. Izvještaj se ne kreira.

![aoi](screenshots/17-aoi-statistics-kml.png)

### FC_PDR14 — Dvojezičnost (BS/EN)
- Svi PDR ekrani, CLC klase i PDF su dvojezični.
- **Test:** klikni globus u lijevom meniju (EN → BS) i otvori http://localhost:3000/#/pdr/1.

![bs](screenshots/18-bosnian-language-report.png)

### B17 — Brčko distrikt · B18 — Strogo razdvajanje po entitetima
- Novi entitet/modul `bd`. Klasifikacija regija, slojeva i požara za Brčko.
- `ENTITY_STRICT_SCOPING=true`: uloge bez entitetskog modula vide samo zajedničke podatke (C6/PDR8).
  Ostavljeno je **isključeno**, jer bi inače uloge poput Civilne zaštite odmah izgubile pristup FBiH/RS podacima.
  JICA i MoS dobijaju sve entitetske module, pa nastavljaju vidjeti cijelu BiH.
- **Odluka za tebe:** koje uloge dobijaju koji entitet prije uključivanja strogog moda.

### B12 — MODIS Terra/Aqua (MOD14/MYD14) žarišne tačke · B16/F12 — Log sinhronizacije
- `PollModisHotspots` svakih 20 min (treba `FIRMS_MAP_KEY`) šalje detekcije u postojeći FireWatch.
- Tabela `data_sync_runs` bilježi FireWatch, MODIS i PDR uvoze. API je `/api/data-sync-runs`, a u UI-ju je tab **Data synchronisation**.
- **Test:** http://localhost:3000/#/pdr/sync

![sync](screenshots/20-data-sync-status.png)

### B20 / F11 — Upravljanje korisnicima (FC_PDR15)
- API `/api/admin/users`: lista, kreiranje, izmjena, onemogući/omogući (modul `users`).
- Jaka lozinka (min. 12, slova i brojevi).
- Samo super-admin može dodijeliti ulogu super-admina ili mijenjati super-admin naloge.
- Korisnik ne može onemogućiti sebe niti promijeniti vlastitu ulogu.
- Onemogućen nalog se ne može ulogovati, a postojeća sesija mu se odmah prekida (middleware `active-user`).
- **Test:**
  1. Uloguj se kao `pdr.admin` i klikni zupčanik (**System**) u lijevom meniju.
  2. **New user** → popuni formu → **Create account**.
  3. Klikni **Disable** pored novog naloga.
  4. Probaj se ulogovati tim nalogom: treba pisati „This account has been disabled.“

| Lista | Novi korisnik | Kreiran i onemogućen |
|---|---|---|
| ![](screenshots/21-users-list.png) | ![](screenshots/22-users-create-form.png) | ![](screenshots/23-users-created-and-disabled.png) |

### F9 — Dashboard praćenja: PDR sažetak (FC_PDR09)
- `GET /api/pdr-reports/summary`: broj izvještaja po statusu, odobrena površina i šteta ove godine, posljednji izvještaji i greške sinhronizacije u 24 h. Uvijek je ograničeno na entitet korisnika.
- Prikazuje se na **Fire monitoring** dashboardu i na vrhu liste PDR izvještaja. MODIS je dodan u indikatore zdravlja izvora.
- **Test:**
  1. Uloguj se kao `pdr.methodologist` i klikni ikonu plamena (**Fire monitoring**).
  2. Otvori http://localhost:3000/#/pdr.

| Fire monitoring | PDR lista |
|---|---|
| ![](screenshots/24-fire-dashboard-pdr-summary.png) | ![](screenshots/25-pdr-list-with-summary.png) |

### B22 — Load test (PDR11)
- `nffis-backend/scripts/load/pdr-load-test.mjs` nema zavisnosti.
- Svaki virtualni korisnik ima vlastitu Sanctum sesiju. Mjere se p50/p95, propusnost i stopa grešaka. Opcije: `--report=1` (detalj + JSON export), `--aoi=1` (puna PostGIS analiza).
- Lokalni rezultat (3 korisnika, `artisan serve` je jednonitni) je u [load-test-local.txt](load-test-local.txt): **0 % grešaka**.
- Za stvarnu mjeru pokreni na staging serveru (php-fpm), npr. sa `--users=50 --duration=120`. Login je ograničen na 5 pokušaja u minuti po IP adresi.

```bash
NFFIS_BASE_URL=https://api.nffis.com:81 NFFIS_ORIGIN=https://nffis.com NFFIS_LOGIN=... NFFIS_PASSWORD=... node scripts/load/pdr-load-test.mjs --users=20 --duration=60 --aoi=1
```

### D1/D2 — Evaluacija izvora podataka i šablon metodološke napomene
- `nffis-backend/docs/PDR_DATA_SOURCES.md` sadrži:
  - EU/globalne izvore naspram lokalnih izvora visoke rezolucije (sastojine, katastar, registri);
  - kako se lokalni izvor uključuje preko env varijabli;
  - checklistu za metodološki tim;
  - `gdal_rasterize` recept za CLC 100 m;
  - šablon napomene za odobravanje koeficijenata.

### B13 — Angström, GFDI i KBDI kao dnevni serverski proizvodi · F7 — zasebni slojevi s timeline-om (FC_PDR06, FC_PDR11)
- Fire Intelligence worker (`scripts/fire-intelligence-worker.py`) uz FWI sada računa još tri dnevna indeksa za cijelu BiH (mreža 0,1°). Svaki se čuva kao zaseban zapis u `fire_weather_products` (`index_type` = `ANGSTROM`, `GFDI`, `KBDI`), s COG i GeoJSON artefaktom, i ima historiju kao FWI.
- **Nema novog povlačenja s Open-Meteo.** Indeksi koriste iste satne podatke (temperatura, vlažnost, padavine, vjetar) koje FWI već preuzima, u prognozi i u historijskom backfillu. Test to provjerava (jedan zahtjev po batchu).
- Standardne formule umjesto heuristika iz `GISMap.tsx`:
  - **Angström** (Chandler i sar. 1983): `I = H/20 + (27 − T)/10`, s T i RH u 13:00. Klase: < 2,0 vrlo vjerovatan požar, 2,0–2,5 povoljno, 2,5–4,0 nepovoljno, > 4,0 malo vjerovatno. Niža vrijednost znači veću opasnost.
  - **GFDI** (McArthur Mark 3, Noble, Bary i Gill 1980): `F = 2,0·exp(−23,6 + 5,01·ln C + 0,0281·T − 0,226·√H + 0,633·√V)`, s T, RH i vjetrom u podne. Stepen sušenja trave `C` je konfigurisana mjesečna pretpostavka (nema mjerenja). Klase: 5 / 12 / 25 / 50.
  - **KBDI** (Keetch i Byram 1968, metrički oblik, 0–203,2 mm): dnevni korak iz maksimalne dnevne temperature, 24-satnih padavina i prosječne godišnje količine padavina (1250 mm, konfigurabilno). Prvih 5,08 mm kišnog niza se ne računa. KBDI je **stateful** kao FFMC/DMC/DC: stanje po tački ide u `state_grid` i sljedeća prognoza nastavlja od njega. Klase: 50 / 100 / 150 mm.
- Pretpostavke (stepen sušenja trave, godišnje padavine, inicijalni KBDI) su u `config/fire_intelligence.php` → `weather.supplementary_indices`. Svaki GFDI/KBDI proizvod nosi upozorenje o tome.
- API (modul `fire-intelligence`, pravo `view`):
  - `GET /api/fire-intelligence/availability/{FWI|ANGSTROM|GFDI|KBDI}?days=&date=`: jedan odobreni proizvod po datumu (historijska reanaliza ima prednost nad prognozom). `fwi-availability` ostaje kao alias.
  - `GET /api/fire-intelligence/availability?days=365`: koji indeksi postoje za koji datum.
- Frontend: meni **FWI** ima tri nova sloja (Angströmov indeks, Indeks požara trave (GFDI), Keetch–Byram indeks suše). U jednom trenutku je uključen jedan sloj opasnosti, a svi dijele isti timeline datuma. Legenda prikazuje skalu i klase tog indeksa i srednju vrijednost za izabrani datum. Novi slojevi ne pokreću klijentsko povlačenje s Open-Meteo kao stari heuristički.
- **Lokalni demo podaci (sintetički):** na ovoj mašini nema GDAL-a, a nisam htio trošiti Open-Meteo kvotu. Zato `scripts/dev/fire-indices-demo-worker.py` pušta pravi worker i pravi job nad **sintetičkim** vremenom (bez mrežnih poziva) i piše COG preko rasterio. Brojevi na screenshotovima zato **nisu stvarno vrijeme**, samo pokazuju da lanac radi.
- **Test:**
  1. Generiši 30 dana demo podataka (Python s `numpy`, `requests` i `rasterio`, ili GDAL):
     ```bash
     cd nffis-backend
     APP_ENV=pdrdev FI_DEMO_PYTHON=/putanja/do/python php artisan tinker --execute="require base_path('scripts/dev/seed-fire-indices-demo.php');"
     ```
     Očekivano: `{"status":"approved"}` i po 30 proizvoda za FWI, ANGSTROM, GFDI i KBDI.
  2. Uloguj se kao `pdr.admin`, na mapi klikni **FWI** u gornjoj traci → **Keetch–Byram indeks suše**. Raster pokriva BiH, legenda pokazuje 0–203,2 mm i vrijednost za zadnji datum.
  3. U timeline-u izaberi 7. 10. 2026. (dan nakon sintetičke kiše): KBDI pada (≈ 8,5 mm naspram ≈ 35 mm 19. 10.) i karta postaje zelenija. **Play** animira sve datume.
  4. Prebaci na **Angströmov indeks** i **Indeks požara trave (GFDI)**: svaki ima svoju skalu, a timeline ostaje isti.
  5. `GET /api/fire-intelligence/availability/kbdi` vraća 30 datuma s `method_version` „Keetch-Byram drought index, metric…“.

![KBDI raster](screenshots/26-kbdi-server-raster.png)
![Angström raster](screenshots/27-angstrom-server-raster.png)
![GFDI raster](screenshots/28-gfdi-server-raster.png)
![KBDI timeline 7. 10.](screenshots/29-kbdi-timeline-7-oct.png)

- **Produkcija:** novi indeksi nastaju automatski uz svaku šestosatnu prognozu. Datumi koji su već arhivirani imaju samo FWI. Popunjavanje historije za ostale indekse (`fire-intelligence:backfill-fwi`) ponovo povlači historijske podatke s Open-Meteo, pa to treba isplanirati prema kvoti. Nisam ga pokretao.

### Sigurnosna ispravka
- SHP/KMZ upload provjerava veličinu svake datoteke u arhivi prije raspakivanja (maks. 50 MB), kao zaštitu od zip-bomb napada. Ima i test.

---

## Automatski testovi

| Repo | Rezultat |
|---|---|
| Backend: PDR + MODIS + korisnici (`php artisan test --filter='Pdr\|Modis\|UserManagement'`) | **29/29 prolazi**, uključujući 4 PostGIS testa sa poligonom poznate površine |
| Backend: cijeli suite | 13 padova koji su postojali **i prije mojih izmjena** (nema `../gis/forest/bih-boundary.geojson`, `host.docker.internal:5432` nedostupan) |
| Backend: indeksi B13 (`php artisan test --filter='FireSupplementaryIndices\|FireIndexAvailability'`) | **9/9 prolazi**: formule prema objavljenim jednačinama, KBDI kiša/granice, worker bez dodatnih zahtjeva, API |
| Frontend (`npx vitest run`) | **155/155 prolazi** (uključujući `tests/supplementary-indices.test.tsx`) |
| `vite build` | prolazi; PDR je zaseban lazy chunk od 47 kB |

## Commitovi (lokalno, nisu pushani)

Grana `feature/pdr-module`:

- **Backend:**
  - B1/B2 workflow i perimetar
  - analitika, koeficijenti, proračun, AOI
  - ERCC PDF/JSON export
  - Brčko i strogo razdvajanje
  - MODIS i log sinhronizacije
  - upravljanje korisnicima
  - dashboard sažetak
  - load test i dokumentacija
  - zip zaštita
- **Frontend:**
  - PDR UI (wizard, rezultati, verifikacija, matrica, AOI)
  - export dugmad
  - opcija Brčko distrikt
  - tab za sinhronizaciju
  - administracija korisnika
  - PDR sažetak na dashboardu

## Ostaje / ograničenja
- **Board api.bosancica.ai:82:** port je otvoren, ali svaki HTTP zahtjev iz terminala ili iz novog Chrome taba dobija *connection reset*. Taskove treba unijeti ručno iz `PDR_GAP_TASKS.md`, ili provjeriti firewall ili whitelist na serveru.
- Koeficijenti su placeholder. Formule i stope mora definisati i odobriti metodološki tim (PDR04).
- Demo podaci pokrivaju samo područje Sarajeva. Za cijelu BiH pokreni `pdr:import-layers` bez `--bbox` (CLC brzo, OSM objekti ~1–2 h).
- Stanovništvo je procjena iz broja objekata. Bolje bi bilo koristiti GHS-POP raster ili popisne krugove.
- Nije urađeno:
  - **B14**: FWI iz IDW interpolacije AWS osmatranja. B13 je urađen (vidi gore).
    Napomena: popup šume u `GISMap.tsx` (`computeFireIndexMetrics`) i dalje prikazuje stare heurističke KBDI/GFI vrijednosti. Slojevi na karti ih više ne koriste.
  - **B15**: registar slojeva kao vremenska serija.
  - **F8**: timeline za hotspote i VDM. F7 je urađen u sklopu B13.
  - **B21/F13** je u praksi pokriven PDR metapodacima (stradali, opasne materije, intervencija, tražena pomoć). Postojeći obrazac incidenta nije proširivan.
