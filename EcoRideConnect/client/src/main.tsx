import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Register PWA Service Worker (vite-plugin-pwa)
// This enables installability and offline caching in production builds.
// In dev, it’s inert.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
	// Lazy import to avoid top-level await and ensure compatibility with build targets
	import('virtual:pwa-register')
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
