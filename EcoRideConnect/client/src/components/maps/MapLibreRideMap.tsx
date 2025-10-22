import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { LngLatBoundsLike } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type LatLng = { lat: number; lng: number };

export function MapLibreRideMap({
  pickup,
  dropoff,
  rider,
  driver,
  height = 320,
  autoFit = false,
  path,
}: {
  pickup?: LatLng;
  dropoff?: LatLng;
  rider?: LatLng | null;
  driver?: LatLng | null;
  height?: number;
  autoFit?: boolean;
  path?: LatLng[];
}) {
  const ORS_KEY = (import.meta as any).env?.VITE_ORS_API_KEY as string | undefined;

  const center = useMemo<LatLng>(() => {
    if (rider) return rider;
    if (driver) return driver;
    if (pickup) return pickup;
    return { lat: 28.6139, lng: 77.209 };
  }, [rider, driver, pickup]);

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
          headers: { "Content-Type": "application/json", Authorization: ORS_KEY },
          body: JSON.stringify({ coordinates: [[pickup.lng, pickup.lat], [dropoff.lng, dropoff.lat]] }),
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

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [k: string]: maplibregl.Marker }>({});

  // Init map
  useEffect(() => {
    if (!mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [center.lng, center.lat],
      zoom: 12,
      attributionControl: true,
    });
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update center
  useEffect(() => {
    const m = mapInstance.current; if (!m) return;
    m.setCenter([center.lng, center.lat]);
  }, [center.lat, center.lng]);

  // Fit bounds
  useEffect(() => {
    const m = mapInstance.current; if (!m || !autoFit) return;
    const pts: LatLng[] = [];
    if (pickup) pts.push(pickup);
    if (dropoff) pts.push(dropoff);
    if (rider) pts.push(rider);
    if (driver) pts.push(driver);
    if (!pts.length) return;
    const b: maplibregl.LngLatBounds = new maplibregl.LngLatBounds([
      pts[0].lng, pts[0].lat,
    ], [pts[0].lng, pts[0].lat]);
    pts.forEach(p => b.extend([p.lng, p.lat]));
    try { m.fitBounds(b as unknown as LngLatBoundsLike, { padding: 64 }); } catch {}
  }, [autoFit, pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng, rider?.lat, rider?.lng, driver?.lat, driver?.lng]);

  // Markers
  useEffect(() => {
    const m = mapInstance.current; if (!m) return;
    const mapMarker = (key: string, pos: LatLng | undefined | null, label: string) => {
      const existing = markersRef.current[key];
      if (!pos) { if (existing) { existing.remove(); delete markersRef.current[key]; } return; }
      if (existing) { existing.setLngLat([pos.lng, pos.lat]); return; }
      const el = document.createElement("div");
      el.style.background = "#27AE60";
      el.style.color = "#fff";
      el.style.padding = "2px 6px";
      el.style.borderRadius = "999px";
      el.style.fontSize = "12px";
      el.style.fontWeight = "600";
      el.textContent = label;
      markersRef.current[key] = new maplibregl.Marker({ element: el }).setLngLat([pos.lng, pos.lat]).addTo(m);
    };
    mapMarker("pickup", pickup, "P");
    mapMarker("dropoff", dropoff, "D");
    mapMarker("rider", rider || undefined, "R");
    mapMarker("driver", driver || undefined, "DRV");
  }, [pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng, rider?.lat, rider?.lng, driver?.lat, driver?.lng]);

  // Polyline as GeoJSON layer
  useEffect(() => {
    const m = mapInstance.current; if (!m) return;
    const map = m as maplibregl.Map;
    const sourceId = "route-line";
    const layerId = "route-line-layer";

    function ensure() {
      if (map.getSource(sourceId)) return;
      map.addSource(sourceId, {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
      } as any);
      map.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,
        paint: { "line-color": "#27AE60", "line-opacity": 0.9, "line-width": 4 },
      });
    }

    function update(coords: [number, number][]) {
      const src = map.getSource(sourceId) as any;
      if (!src) return;
      src.setData({ type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: {} });
    }

    map.once("load", () => {
      ensure();
      update(routePath ? routePath.map(p => [p.lng, p.lat]) : []);
    });

    if (map.isStyleLoaded()) {
      ensure();
      update(routePath ? routePath.map(p => [p.lng, p.lat]) : []);
    }

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(routePath)]);

  return <div style={{ height }} ref={mapRef} />;
}

export default MapLibreRideMap;
