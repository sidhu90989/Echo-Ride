import { useEffect, useMemo, useState } from "react";
import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { MapLibreRideMap, type LatLng as ML } from "./MapLibreRideMap";

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
  const ORS_KEY = (import.meta as any).env?.VITE_ORS_API_KEY as string | undefined;
  const useMapLibre = ((import.meta as any).env?.VITE_USE_MAPLIBRE ?? 'false') === 'true' || !apiKey;

  // Fallback: render MapLibre map when Google key is missing or MapLibre explicitly requested
  if (useMapLibre) {
    return (
      <MapLibreRideMap
        pickup={pickup as ML | undefined}
        dropoff={dropoff as ML | undefined}
        rider={rider as ML | undefined}
        driver={driver as ML | undefined}
        height={height}
        autoFit={autoFit}
        path={path as ML[] | undefined}
      />
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

  // Optional: fetch a real route polyline from OpenRouteService when a key is provided
  const [orsPath, setOrsPath] = useState<LatLng[] | undefined>(undefined);
  useEffect(() => {
    let abort = false;
    async function getRoute() {
      if (!ORS_KEY || !pickup || !dropoff) {
        setOrsPath(undefined);
        return;
      }
      try {
        const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: ORS_KEY,
          },
          body: JSON.stringify({
            coordinates: [
              [pickup.lng, pickup.lat],
              [dropoff.lng, dropoff.lat],
            ],
          }),
        });
        if (!res.ok) throw new Error(`ORS ${res.status}`);
        const json = await res.json();
        const coords: Array<[number, number]> = json?.features?.[0]?.geometry?.coordinates || [];
        const pts: LatLng[] = coords.map(([lng, lat]) => ({ lat, lng }));
        if (!abort) setOrsPath(pts.length >= 2 ? pts : undefined);
      } catch (_e) {
        if (!abort) setOrsPath(undefined);
      }
    }
    getRoute();
    return () => { abort = true; };
  }, [ORS_KEY, pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng]);

  const routePath = useMemo<LatLng[] | undefined>(() => {
    if (path && path.length >= 2) return path;
    if (orsPath && orsPath.length >= 2) return orsPath;
    if (pickup && dropoff) return [pickup, dropoff];
    return undefined;
  }, [path, orsPath, pickup, dropoff]);

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
