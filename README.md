<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1m4-tsfYsevdEMjjAU6gq3FWPYfdH77rK

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Start the local Laravel API on `http://localhost:8080`. Vite proxies `/api` and `/sanctum` through `localhost:3000`, keeping the session and CSRF cookies same-origin. Set `VITE_LOCAL_API_ORIGIN` if the local API uses a different origin, or `VITE_API_BASE_URL` to route the proxy to the deployed API.
3. Configure `GEMINI_API_KEY` only in the backend environment; it must never be placed in frontend Vite variables.
4. Run the app:
   `npm run dev`

Development-only URLs for the extreme FWI scenario and the Leaflet, MapLibre
and Mapbox comparison maps are listed in [TEST_ROUTES.md](./TEST_ROUTES.md).

## External map layers

The default vector-style background uses OpenStreetMap raster tiles. Sentinel-2
cloudless imagery is served by EOX. NASA FIRMS fire detections and MODIS
land-surface temperature are served as WMS overlays by NASA EOSDIS GIBS. The
Windy-labelled view uses the application's Open-Meteo wind-vector renderer.
These integrations do not require browser API keys. Provider attribution must
remain visible.

## Map renderer comparison builds

Leaflet remains the default renderer. During local development, open the app
with `?mapRenderer=maplibre` to load the isolated MapLibre proof of concept and
with `?mapRenderer=mapbox` to load the equivalent Mapbox GL implementation. Use
`?mapRenderer=leaflet` to switch back. Mapbox requires a public `pk.*` token in
`VITE_MAPBOX_ACCESS_TOKEN`; restrict that token to the deployed application URLs
in the Mapbox account.

Production builds require `VITE_ENABLE_MAPLIBRE_POC=true` or
`VITE_ENABLE_MAPBOX_POC=true` before the corresponding query option is accepted.
`VITE_MAP_RENDERER_DEFAULT` may be `leaflet`, `maplibre`, or `mapbox`, but a GL
renderer becomes the default only while its feature gate is enabled.

The proof of concept supports the existing raster basemaps, database GeoJSON,
MVT and raster layers, NASA/forest WMS overlays, incident heatmaps, filters,
feature selection and report-location clicks. Wind, AWS, generated FWI rasters
and geometry editing intentionally stay on the Leaflet fallback until the
comparison meets its reliability and performance gates.

The GL status badge reports renderer load, operational readiness, source errors
and browser long tasks. All three renderers expose the same fields at
`window.__NFFIS_MAP_METRICS__` for scripted collection. Leaflet operational
readiness is recorded after 750 ms without map/tile activity; the GL renderers
use their first `idle` event after dataset synchronization. Both GL renderers share the
same application-layer rendering core so their measurements exercise equivalent
sources, layers, styling and event behavior.

## cPanel frontend redeploy

`redeploy.php` updates a cPanel checkout from Git, installs the locked dependencies,
and builds `dist/` on the server. Before pulling, it restores only the generated
`dist/` files so an earlier server build cannot block the next fast-forward update.
Open this URL from any machine to start it:

```text
https://nffis.com/redeploy.php
```

The cPanel account needs Git, Node.js 20 or newer with npm, outbound Git access, and
permission to write the frontend checkout from its `main` branch. The script detects
standard cPanel and CloudLinux npm installations automatically. The endpoint is public
and intentionally has no authentication; anyone who knows the URL can trigger a deployment.
A lock prevents simultaneous deployments.

If the server still has an older `redeploy.php`, upload this file once through cPanel
File Manager, then open `https://nffis.com/redeploy.php`.

test change
