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
        icons: [
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
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
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
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
