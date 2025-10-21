import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/icon-192x192.png',
        'icons/icon-512x512.png',
      ],
      manifest: {
        name: 'EcoRide Connect',
        short_name: 'EcoRide',
        description: 'Eco-friendly ridesharing platform',
        theme_color: '#00A86B',
        background_color: '#ffffff',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone'],
        orientation: 'portrait',
        categories: ['travel', 'navigation'],
        prefer_related_applications: false,
        icons: [
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        shortcuts: [
          { name: 'Book a Ride', url: '/rider', short_name: 'Rider' },
          { name: 'Drive', url: '/driver', short_name: 'Driver' }
        ],
      },
    }),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: (() => {
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
    return {
      outDir: isVercel
        ? path.resolve(import.meta.dirname, "client", "dist")
        : path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      // Reduce noisy warnings and split large vendor bundles for faster loads on Vercel
      chunkSizeWarningLimit: 1500, // KB; only affects warning threshold, not output
      rollupOptions: {
        output: {
          // Auto-split vendor code by top-level package to avoid a single huge chunk
          manualChunks(id) {
            if (id.includes('node_modules')) {
              const parts = id.toString().split('node_modules/')[1].split('/');
              // Scoped packages like @radix-ui/react-... -> @radix-ui
              const pkg = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
              return pkg;
            }
          },
        },
      },
    };
  })(),
  // Allow overriding base path for different hosting targets.
  // Default keeps GH Pages base in production; Render sets VITE_BASE_PATH="/".
  base:
    process.env.VITE_BASE_PATH ||
    (process.env.NODE_ENV === "production" ? "/Echo-Ride/" : "/"),
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
