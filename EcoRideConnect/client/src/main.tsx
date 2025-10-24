import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Register PWA Service Worker (vite-plugin-pwa)
// This enables installability and offline caching in production builds.
// In dev, it’s inert.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
	// Lazy import to avoid top-level await and ensure compatibility with build targets
	// @ts-ignore - virtual module provided by vite-plugin-pwa at build time
	const _pwa = import('virtual:pwa-register');
	(_pwa as Promise<any>)
		.then(({ registerSW }) => {
			registerSW({
				immediate: true,
				onNeedRefresh() {
					// Optionally, prompt user to refresh
				},
				onOfflineReady() {
					// App ready for offline use
				},
			});
		})
		.catch(() => {});
}

createRoot(document.getElementById("root")!).render(<App />);
