# Test Routes

These URLs expose development and comparison modes that are not part of the
normal application navigation. Start the frontend with `npm run dev`, then open
the relevant link.

## FWI extreme test

- [Extreme FWI and fire-spread test](http://localhost:3000/?fwiTest=extreme)

This mode adds the synthetic Hutovo Blato fire scenario used to verify the
maximum FWI colour and the localized downwind fire-spread influence. Enable the
**BH FWI** layer and its **Fire spread** option in the map controls after
opening the route. Fire spread is intentionally off by default.

The generated FWI raster is currently implemented by the Leaflet map, so this
test should be run with Leaflet. The explicit equivalent URL is:

- [Extreme FWI test using Leaflet](http://localhost:3000/?mapRenderer=leaflet&fwiTest=extreme)

## Map renderer comparison

- [Leaflet](http://localhost:3000/?mapRenderer=leaflet)
- [MapLibre GL](http://localhost:3000/?mapRenderer=maplibre)
- [Mapbox GL](http://localhost:3000/?mapRenderer=mapbox)

Leaflet is the default and supports the complete application. MapLibre and
Mapbox are comparison implementations; generated FWI rasters, wind, AWS and
geometry editing remain on the Leaflet implementation.

Mapbox requires a public `pk.*` token in `VITE_MAPBOX_ACCESS_TOKEN`. In a
production build, the GL routes also require their corresponding feature flags:

```env
VITE_ENABLE_MAPLIBRE_POC=true
VITE_ENABLE_MAPBOX_POC=true
```

## Built application

When serving `dist/`, use the same query strings on the URL provided by the
static server. For example, if `dist/` is served at `http://localhost:4173`:

- `http://localhost:4173/?fwiTest=extreme`
- `http://localhost:4173/?mapRenderer=leaflet`
- `http://localhost:4173/?mapRenderer=maplibre`
- `http://localhost:4173/?mapRenderer=mapbox`

Run `npm run build` followed by `npm run preview` to test the built application.
The preview server normally uses port `4173`, but use the address printed by
Vite if that port is unavailable.
