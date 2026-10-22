# Supplementary indices in FWI calculations

The superadmin **FWI calculations** panel retains the original Bosnian and
Canadian calculators and adds Angström, McArthur Mark 3 GFDI and metric KBDI.

1. Open **FWI calculations**, choose a date and select a location, or a sample
   under **National overview**.
2. **Calculations** shows the three daily results and their danger classes.
3. **Formula comparison** retains the Bosnian/Canadian comparison and adds
   editable daily index inputs, formulas and KBDI rain/drying intermediate values.
4. Under **Saved Angström, GFDI and KBDI maps**, choose an index to inspect the
   selected date's saved raster and exact calculation record, where retained.

| Index | Weather timing | Additional inputs | Scale |
|---|---|---|---|
| Angström | 13:00 temperature and RH | None | Lower means greater danger |
| GFDI | Noon temperature, RH and 10 m wind in km/h | Monthly grass curing, % | Higher means greater danger |
| KBDI | Calendar-day maximum temperature and previous noon-to-noon rain | Previous KBDI, remaining rain-spell interception, annual mean rainfall | 0–203.2 mm |

The daily supplementary calculations intentionally use their defined hours;
the original current-weather FWI comparison can use the current hour. They
are not normalized scores and their numeric values should not be subtracted
from each other as if they shared a scale.

Grass curing, annual rainfall and the initial KBDI come from backend settings.
The independent point calculator replays the weather window returned by the
inspection endpoint (30 preceding days) and states its replay length. It can
differ from a saved raster initialized with a longer archive. National overview
shows individual sample calculations; the saved grid mean is labelled separately.

New forecast and historical products retain `.calculations.json` sidecars for
all four indices through the existing superadmin audit endpoint. Older historical
audits can be reconstructed offline from cached hourly weather, only when every
point reproduces the saved grid. Older forecasts without full hourly inputs
explicitly report unavailable audit data; they never substitute a new calculation.

Verification on `vedo-fixes-adn-additions`:

- JavaScript equations match frozen reference values from the Python raster worker.
- Tests cover rain interception, consecutive wet days, bounds, invalid/missing
  inputs, noon/13:00 timing, complete rainfall windows and scenario reset.
- All 202 frontend tests pass; the validation build writes to backend `runtime`,
  leaving the deployed `dist` untouched.
- TypeScript reports the same 26 existing errors as the merged local `main`;
  the comparison additions introduce no new diagnostics.
- Live local API verification reproduced historical Angström, GFDI and KBDI
  audits for all 582 grid points and returned configured rainfall/curing settings.

No Docker build, container restart, frontend redeploy or remote push was performed.
