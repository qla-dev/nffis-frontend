import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const configuredApiBaseUrl = env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '');
    const proxyTarget = configuredApiBaseUrl
      ? new URL(configuredApiBaseUrl).origin
      : (env.VITE_LOCAL_API_ORIGIN || 'http://localhost:8080');
    const proxyUsesRemoteApi = Boolean(configuredApiBaseUrl);

    // A remote Sanctum server sets cookies for .nffis.com. When Vite proxies
    // it to localhost, make those cookies host-only and usable over HTTP so
    // browser requests to /sanctum and /api retain the same CSRF session.
    const configureProxyCookies = proxyUsesRemoteApi
      ? (proxy: { on: (event: string, handler: (response: { headers: Record<string, string | string[] | undefined> }) => void) => void }) => {
        proxy.on('proxyRes', (response) => {
          const cookies = response.headers['set-cookie'];
          if (!cookies) return;

          response.headers['set-cookie'] = (Array.isArray(cookies) ? cookies : [cookies]).map((cookie) =>
            cookie
              .replace(/;\s*Domain=[^;]*/i, '')
              .replace(/;\s*Secure/i, ''),
          );
        });
      }
      : undefined;

    return {
      base: mode === 'production' ? '/dist/' : '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: proxyTarget,
            changeOrigin: true,
            configure: configureProxyCookies,
          },
          '/sanctum': {
            target: proxyTarget,
            changeOrigin: true,
            configure: configureProxyCookies,
          },
          // Forest rasters are requested as WMS images. Proxy local GeoServer
          // so capabilities validation and tile requests remain same-origin.
          '/geoserver': {
            target: env.VITE_GEOSERVER_ORIGIN || 'http://localhost:8600',
            changeOrigin: true,
          },
        },
      },
      plugins: [react()],
      // Mapbox GL's ESM entry emits a code-split module worker. Vite's default
      // IIFE worker format cannot represent that graph.
      worker: {
        format: 'es',
      },
      // These packages reference module workers through import-query URLs.
      // Prebundling them creates an invalid `.vite/deps/worker.js?...` URL;
      // let Vite's normal module transformer process those worker imports.
      optimizeDeps: {
        exclude: ['mapbox-gl', 'mapbox-gl/esm', 'maplibre-gl'],
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules/mapbox-gl')) return 'mapbox';
              if (id.includes('node_modules/maplibre-gl')) return 'maplibre';
              if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) return 'mapping';
              if (id.includes('node_modules/geotiff') || id.includes('node_modules/plotty') || id.includes('@qartlabs')) return 'raster';
              if (id.includes('node_modules/react')) return 'react-vendor';
            },
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
