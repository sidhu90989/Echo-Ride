// Google-only preview: MapLibre is disabled. This stub exists to avoid build-time imports.
// If you need an open-source basemap in the future, reintroduce MapLibre and its dependency.
export type LatLng = { lat: number; lng: number };
export type SimpleDriver = { id: string; lat: number; lng: number };

export function MapLibreRideMap(_: {
  pickup?: LatLng;
  dropoff?: LatLng;
  rider?: LatLng | null;
  driver?: LatLng | null;
  drivers?: SimpleDriver[];
  height?: number;
  autoFit?: boolean;
  path?: LatLng[];
}) {
  return (
    <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#0f172a' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>MapLibre disabled</div>
        <div style={{ fontSize: 13 }}>This build uses Google Maps only. Set VITE_GOOGLE_MAPS_API_KEY.</div>
      </div>
    </div>
  );
}

export default MapLibreRideMap;
