import { useEffect, useMemo, useRef, useState } from "react";
import { RideMap, type LatLng } from "@/components/maps/RideMap";
import MapLibreRideMap from "@/components/maps/MapLibreRideMap";

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
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const envUseMapLibre = (import.meta as any).env?.VITE_USE_MAPLIBRE === 'true';
  const [googleReady, setGoogleReady] = useState<boolean | null>(null);

  // Detect whether Google Maps script became available in a reasonable time.
  useEffect(() => {
    if (!apiKey) {
      setGoogleReady(false);
      return;
    }
    setGoogleReady(null);
    const check = () => {
      // @ts-ignore
      const ok = typeof window !== 'undefined' && !!(window as any).google?.maps;
      setGoogleReady(ok);
    };
    const t = window.setTimeout(check, 2500);
    return () => window.clearTimeout(t);
  }, [apiKey]);

  const useMapLibre = envUseMapLibre || !apiKey || googleReady === false;

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

  if (!apiKey && !useMapLibre) {
    return (
      <div className="aspect-[4/3] rounded-2xl bg-card border shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-sky-blue/10" />
        <div className="absolute inset-0 p-6 flex items-end">
          <div className="bg-background/70 backdrop-blur rounded-xl p-4 border text-sm text-muted-foreground">
            Add VITE_GOOGLE_MAPS_API_KEY to show live preview map
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border shadow-xl overflow-hidden">
      {useMapLibre ? (
        <MapLibreRideMap
          pickup={pickup}
          dropoff={dropoff}
          rider={rider}
          driver={driver}
          path={path}
          height={320}
          autoFit={false}
        />
      ) : (
        <RideMap
          apiKey={apiKey!}
          pickup={pickup}
          dropoff={dropoff}
          rider={rider}
          driver={driver}
          path={path}
          height={320}
          autoFit={false}
        />
      )}
    </div>
  );
}

export default HomeMapHero;
