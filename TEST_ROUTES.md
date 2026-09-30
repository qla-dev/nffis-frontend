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

The generated FWI raster is available as a native Mapbox image/raster layer. To
compare the independent Leaflet emergency fallback explicitly, use:

- [Extreme FWI test using Leaflet](http://localhost:3000/?mapRenderer=leaflet&fwiTest=extreme)

## Map renderer comparison

- [Leaflet](http://localhost:3000/?mapRenderer=leaflet)
- [MapLibre GL](http://localhost:3000/?mapRenderer=maplibre)
- [Mapbox GL](http://localhost:3000/?mapRenderer=mapbox)

Mapbox is the configured default when its production flag and public token are
present. Leaflet remains an independent emergency fallback. Mapbox renders the
base map, dataset GeoJSON/MVT/raster/WMS layers, FWI, wind, AWS, active fires,
assets, weather tools and geometry editor directly; no Leaflet instance is
mounted inside Mapbox mode.

Mapbox requires a public `pk.*` token in `VITE_MAPBOX_ACCESS_TOKEN`. In a
production build, the GL routes also require their corresponding feature flags:

```env
VITE_ENABLE_MAPLIBRE_POC=true
VITE_ENABLE_MAPBOX=true
VITE_MAP_RENDERER_DEFAULT=mapbox
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
