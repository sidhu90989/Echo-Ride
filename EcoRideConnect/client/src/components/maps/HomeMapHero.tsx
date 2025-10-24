import { useEffect, useMemo, useRef, useState } from "react";
import MapComponent, { type Driver } from "@/components/MapComponent";
import type { LatLngLike as LatLng } from "@/utils/mapUtils";

function interpolatePath(a: LatLng, b: LatLng, steps = 60): LatLng[] {
  const pts: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push({
      lat: a.lat + (b.lat - a.lat) * t,
      lng: a.lng + (b.lng - a.lng) * t,
    });
  }
  return pts;
}

export function HomeMapHero() {
  // MapComponent now falls back to MapLibre automatically when no Google key

  // Demo route between two Delhi points
  const pickup = useMemo<LatLng>(() => ({ lat: 28.6139, lng: 77.2090 }), []);
  const dropoff = useMemo<LatLng>(() => ({ lat: 28.6353, lng: 77.2249 }), []);

  const path = useMemo<LatLng[]>(() => interpolatePath(pickup, dropoff, 100), [pickup, dropoff]);

  const [driver, setDriver] = useState<LatLng | null>(path[0]);
  const [rider, setRider] = useState<LatLng | null>(null);
  const idxRef = useRef(0);

  // Smooth animation along the path
  useEffect(() => {
    const id = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % path.length;
      setDriver(path[idxRef.current]);
    }, 150); // ~15 updates/sec for smoothness
    return () => clearInterval(id);
  }, [path]);

  // Optional: track visitor location if permitted
  useEffect(() => {
    let watchId: number | null = null;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setRider({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
      );
    }
    return () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); };
  }, []);

  return (
    <div className="rounded-2xl border shadow-xl overflow-hidden">
      <div style={{height: 320}}>
        <MapComponent
          // apiKey can be omitted to use VITE_GOOGLE_MAPS_API_KEY
          pickup={pickup}
          drop={dropoff}
          drawRoute={true}
          drivers={useMemo<Driver[]>(() => [
            driver ? { id: 'moving1', lat: driver.lat, lng: driver.lng, vehicle_type: 'E-Rickshaw', is_available: true, name: 'Rider-1', rating: 4.8 } :
            { id: 'static1', lat: pickup.lat + 0.005, lng: pickup.lng + 0.005, vehicle_type: 'E-Scooter', is_available: true, name: 'Scoot-1', rating: 4.6 },
            { id: 'static2', lat: pickup.lat - 0.004, lng: pickup.lng - 0.006, vehicle_type: 'CNG', is_available: true, name: 'CNG-1', rating: 4.5 },
          ], [driver, pickup.lat, pickup.lng])}
        />
      </div>
    </div>
  );
}

export default HomeMapHero;
