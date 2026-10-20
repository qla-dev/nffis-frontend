# NFFIS PDR Module — gap analysis and tasks

Source: *NFFIS PDR Client Requirement Document v1.1* (April 2026), compared with
`nffis-frontend` @ 1a79cbc and `nffis-backend` @ 01a73a8 (2026-10-19).

## What already exists

- Perimeters (`fire-intelligence/perimeters`), burn severity and `FireImpactService`
  (PostGIS intersection of severity zones with forest, protected, roads, water,
  buildings and municipality layers matched **by layer name**).
- FireWatch hotspot polling (MTG, FIRMS, Sentinel-3), lifecycle, notifications.
- Server FWI rasters (COG) with history/backfill, `FwiDateTimeline`.
- VDM build commands (`vegetation:build-bih`, `vegetation:build-hnk`).
- Angström / GFI / KBDI rendered **in the browser** from AWS points.
- Incident reports (`reports`), report PDF (dompdf), daily weather report.
- Roles/modules RBAC, FBiH/RS jurisdiction modules, layer role access.
- UI languages EN / BS / JA (partial coverage — many screens hard-coded EN).

## Tasks

### Backend

| ID | Task | Req |
|----|------|-----|
| B1 | ✅ **PDR report entity**: `pdr_reports` table + model (incident link, perimeter, status draft→calculated→submitted→approved/rejected, jurisdiction, versioned results JSON, data-source provenance, approver, timestamps) and CRUD API with RBAC | FC_PDR01/07, PDR9 |
| B2 | ✅ **Perimeter upload**: accept SHP (zip) / KML / GeoJSON, convert to 4326 MultiPolygon, validate (valid, closed, inside BiH, no self-overlap), compute area | FC_PDR01 step 2, PDR1 |
| B3 | ✅ **Land-cover classification (CLC 2018)**: import CLC 2018 for BiH (vector + 100 m raster via gdal_rasterize), register layer; intersect burnt polygon → ha per CLC class grouped into commercial forest / agricultural / low vegetation; unioned geometry so no double counting | PDR01, C2, PDR1 |
| B4 | ✅ **Explicit analysis layer config**: replace name-guessing in `FireImpactService` with a configurable mapping (dataset key → layer id, local vs EU source) | PDR1, PDR3 |
| B5 | ✅ **Infrastructure exposure**: road length (km) by class and building count/area within perimeter (+ configurable buffer) | PDR02 |
| B6 | ✅ **Protected areas**: import protected-area / Natura layer, report ha per protected zone | PDR03 |
| B7 | ✅ **Population exposure**: population estimate in perimeter + buffer (GHS-POP or local density layer) | C2 |
| B8 | ✅ **Economic coefficient matrix**: versioned coefficients (EUR/ha per land-cover class, EUR/km road, EUR/building) editable and approved by Role 3; audit history | PDR04, PDR2 |
| B9 | ✅ **Damage calculation engine**: run B3–B8 for a perimeter, store results with provenance, < 2 min target, queued job with status | C1, C3 |
| B10 | ✅ **AOI statistics endpoint**: same analysis for an ad-hoc polygon without creating a report | FC_PDR12, PDR7 |
| B11 | ✅ **ERCC bilingual PDF + JSON export**: mandatory UCPM fields, CLC table, infrastructure, population, protected areas, damage, data sources, affected-area map image, BS + EN | FC_PDR02, C1, PDR3 |
| B12 | ✅ **MODIS MOD14/MYD14 hotspots**: add FIRMS MODIS_NRT source (Terra/Aqua flagged) to FireWatch polling | PDR07 |
| B13 | ✅ **Server-side Angström, GFI, KBDI rasters**: compute from AWS on schedule, store as historized COG products like FWI | FC_PDR06, PDR6, PDR06 |
| B14 | **FWI from AWS observations**: interpolate station observations (IDW) into FWI grid (currently Open-Meteo model grid) | PDR09 |
| B15 | **Layer registry / time series**: register every generated product (FWI, VDM, hotspots, indices) as a time-series layer with an availability API | PDR10, PDR5 |
| B16 | ✅ **Sync log**: persist each cron/sync run (source, status, records, errors) and expose admin API | PDR4, PDR05 |
| B17 | ✅ **Brčko District jurisdiction**: add `bd` entity/module, region classification, scope reports/incidents/layers | FC_PDR08, C6 |
| B18 | ✅ **Strict entity scoping**: users with no jurisdiction module must not fall back to all entities; apply scope to fires, perimeters, PDR reports | C6, PDR8 |
| B19 | ✅ **PDR roles**: map Role 2 operational / Role 3 methodological / Role 5 decision maker (read-only approved PDRs) to modules/permissions | §4 |
| B20 | ✅ **User management API** (super-admin): list/create/update/disable users, assign role | FC_PDR15 |
| B21 | **Incident attributes**: extend incident with intervention details, affected area, casualties, dangerous substances, required assistance | FC_PDR13 |
| B22 | ✅ **Load test** script (k6) for main API endpoints | PDR11 |

### Frontend

| ID | Task | Req |
|----|------|-----|
| F1 | ✅ **PDR wizard** (6 steps: incident select/create, upload SHP/KML or draw polygon, metadata, validation, calculation, report) | FC_PDR01 |
| F2 | ✅ **Damage visualization**: summary cards, CLC chart/table, infrastructure, protected-zone impact, map overlay | FC_PDR04 |
| F3 | ✅ **Methodological verification screen** (Role 3): review outputs, source layers, polygon, approve/reject | FC_PDR07 |
| F4 | ✅ **Coefficient matrix admin UI** | PDR2 |
| F5 | ✅ **PDR report list** filterable by entity (FBiH/RS/BD) and status; PDF/JSON download; Role 5 read-only | FC_PDR02/08 |
| F6 | ✅ **AOI tool**: draw polygon on map → statistics panel | FC_PDR12 |
| F7 | ✅ **Fire-risk layers from server rasters**: Angström/GFI/KBDI/FWI separate toggles + timeline | FC_PDR06, FC_PDR11 |
| F8 | **Historical timeline for hotspots and VDM** (not only FWI) | FC_PDR11 |
| F9 | ✅ **Real-time monitoring dashboard**: incidents status, recent detections, PDR summaries | FC_PDR09 |
| F10 | **Full BS/EN translation** of fire monitoring, reports, admin, PDR screens | FC_PDR14 |
| F11 | ✅ **User management UI** | FC_PDR15 |
| F12 | ✅ **Sync status / data source preview panel** | FC_PDR05, PDR4 |
| F13 | **Incident attribute form** extension | FC_PDR13 |

### Analysis / documentation

| ID | Task | Req |
|----|------|-----|
| D1 | ✅ Data-source evaluation: inventory of EU/global (CLC 2018, DEM GLO-30, WorldCover) vs local high-resolution (entity forest maps, cadastre) and which replaces which | §6 |
| D2 | ✅ Methodology note template for Role 3 coefficient approval | PDR04 |

## Suggested order

B1 → B2 → B3/B4 → B5–B7 → B8 → B9 → F1 → F2 → B11 → F3/F5 → B17/B18 → rest.

## Progress

Detailed review log with test steps, URLs and screenshots: [pdr-review/README.md](pdr-review/README.md).
B18 strict scoping is implemented behind `ENTITY_STRICT_SCOPING` (default off). F10 is done for all PDR screens; older screens remain partly English.

- **B1 done** (nffis-backend): `pdr_reports` table, `PdrReport` model, `/api/pdr-reports`
  CRUD + submit + review; modules `pdr-reports` (Role 2 create, Role 5 view approved only)
  and `pdr-methodology` (Role 3 approve/reject, four-eyes rule); entity-scoped.
- **B2 done** (nffis-backend): `POST /api/pdr-reports/{id}/perimeter` and
  `/api/pdr-reports/perimeter/preview` accept zipped SHP, KML, KMZ, GeoJSON or a drawn
  geometry; closes rings, rejects self-intersections, holes outside the shell, overlapping
  parts, non-lon/lat and out-of-country input; geodesic area in ha. On PostGIS also
  reprojects (`source_srid`), runs `ST_IsValid` and the national-boundary check.
