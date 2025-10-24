import { useEffect, useMemo } from "react";
import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps";

export type LatLng = { lat: number; lng: number };

export function RideMap({
  apiKey,
  pickup,
  dropoff,
  rider,
  driver,
  height = 320,
  autoFit = false,
  path,
}: {
  apiKey: string;
  pickup?: LatLng;
  dropoff?: LatLng;
  rider?: LatLng | null;
  driver?: LatLng | null;
  height?: number;
  autoFit?: boolean;
  path?: LatLng[];
}) {
  if (!apiKey) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#0f172a' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Google Maps API key not found</div>
          <div style={{ fontSize: 13 }}>Set VITE_GOOGLE_MAPS_API_KEY and rebuild to enable maps.</div>
        </div>
      </div>
    );
  }

  const center = useMemo<LatLng>(() => {
    if (rider) return rider;
    if (driver) return driver;
    if (pickup) return pickup;
    return { lat: 28.6139, lng: 77.209 };
  }, [rider, driver, pickup]);

  const points = useMemo(() => {
    const pts: LatLng[] = [];
    if (pickup) pts.push(pickup);
    if (dropoff) pts.push(dropoff);
    if (rider) pts.push(rider);
    if (driver) pts.push(driver);
    return pts;
  }, [pickup, dropoff, rider, driver]);

  const routePath = useMemo<LatLng[] | undefined>(() => {
    if (path && path.length >= 2) return path;
    if (pickup && dropoff) return [pickup, dropoff];
    return undefined;
  }, [path, pickup, dropoff]);

  function FitBounds({ enable, pts }: { enable: boolean; pts: LatLng[] }) {
    const map = useMap();
    useEffect(() => {
      if (!map || !enable || !pts.length) return;
      // @ts-ignore
      const bounds = new google.maps.LatLngBounds();
      pts.forEach((p) => bounds.extend(p as any));
      try { map.fitBounds(bounds, 64); } catch {}
    }, [map, enable, JSON.stringify(pts)]);
    return null;
  }

  function PolylineRenderer({ p }: { p: LatLng[] }) {
    const map = useMap();
    useEffect(() => {
      if (!map || !p || p.length < 2) return;
      // @ts-ignore
      const poly = new google.maps.Polyline({
        map,
        path: p as any,
        strokeColor: '#27AE60',
        strokeOpacity: 0.9,
        strokeWeight: 4,
      });
      return () => { poly.setMap(null); };
    }, [map, JSON.stringify(p)]);
    return null;
  }

  return (
    <APIProvider apiKey={apiKey} onLoad={() => {}}>
      <div style={{ height }}>
        <Map defaultZoom={13} defaultCenter={center} gestureHandling="greedy" disableDefaultUI>
          <FitBounds enable={autoFit} pts={points} />
          {pickup && <Marker position={pickup} label="P" />}
          {dropoff && <Marker position={dropoff} label="D" />}
          {rider && <Marker position={rider} label="R" />}
          {driver && <Marker position={driver} label="DRV" />}
          {routePath && <PolylineRenderer p={routePath} />}
        </Map>
      </div>
    </APIProvider>
  );
}
