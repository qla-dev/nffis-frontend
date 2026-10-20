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

---

## Automatski testovi

| Repo | Rezultat |
|---|---|
| Backend: PDR + MODIS (`php artisan test --filter='Pdr\|Modis'`) | **24/24 prolazi**, uključujući 4 PostGIS testa sa poligonom poznate površine |
| Backend: cijeli suite | 13 padova koji su postojali **i prije mojih izmjena** (nema `../gis/forest/bih-boundary.geojson`, `host.docker.internal:5432` nedostupan) |
| Frontend (`npx vitest run`) | **145/145 prolazi** |
| `vite build` | prolazi; PDR je zaseban lazy chunk od 47 kB |

## Commitovi (lokalno, nisu pushani)

Grana `feature/pdr-module`:

- **Backend:**
  - B1/B2 workflow i perimetar
  - analitika, koeficijenti, proračun, AOI
  - ERCC PDF/JSON export
  - Brčko i strogo razdvajanje
  - MODIS i log sinhronizacije
- **Frontend:**
  - PDR UI (wizard, rezultati, verifikacija, matrica, AOI)
  - export dugmad
  - opcija Brčko distrikt
  - tab za sinhronizaciju

## Ostaje / ograničenja
- **Board api.bosancica.ai:82:** port je otvoren, ali svaki HTTP zahtjev iz terminala ili iz novog Chrome taba dobija *connection reset*. Taskove treba unijeti ručno iz `PDR_GAP_TASKS.md`, ili provjeriti firewall ili whitelist na serveru.
- Koeficijenti su placeholder. Formule i stope mora definisati i odobriti metodološki tim (PDR04).
- Demo podaci pokrivaju samo područje Sarajeva. Za cijelu BiH pokreni `pdr:import-layers` bez `--bbox` (CLC brzo, OSM objekti ~1–2 h).
- Stanovništvo je procjena iz broja objekata. Bolje bi bilo koristiti GHS-POP raster ili popisne krugove.
- Nije urađeno: B13 (server-side Angström/GFI/KBDI rasteri), B14 (FWI iz AWS interpolacije), B15, B20/F11 (upravljanje korisnicima), B21/F13, B22 (load test), F7–F9, D1/D2.
