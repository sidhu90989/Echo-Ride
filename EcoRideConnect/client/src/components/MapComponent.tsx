import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  APIProvider,
  Map,
  Marker,
  useMap,
} from '@vis.gl/react-google-maps';
import {DriverMarkers} from './DriverMarkers';
import { MapLibreRideMap, type SimpleDriver } from './maps/MapLibreRideMap';
import {calculateDistance, fitMapBounds} from '../utils/mapUtils';

export type VehicleType = 'E-Rickshaw' | 'E-Scooter' | 'CNG';

export type Driver = {
  id: string;
  lat: number;
  lng: number;
  vehicle_type: VehicleType;
  is_available: boolean;
  name?: string;
  rating?: number;
};

export type LatLng = google.maps.LatLngLiteral;

export interface MapComponentProps {
  apiKey?: string;
  drivers?: Driver[];
  initialCenter?: LatLng;
  initialZoom?: number;
  pickup?: LatLng | null;
  drop?: LatLng | null;
  onPickupSelected?: (pos: LatLng) => void;
  onDropSelected?: (pos: LatLng) => void;
  drawRoute?: boolean; // when true and pickup+drop set, draw route
  className?: string;
  style?: React.CSSProperties;
}

// Simple blue dot marker icon for current user
const blueDotSvg = `data:image/svg+xml;utf8,
<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>
  <circle cx='12' cy='12' r='8' fill='%230077ff' fill-opacity='0.9' />
  <circle cx='12' cy='12' r='11' fill='none' stroke='%230077ff' stroke-opacity='0.35' stroke-width='2' />
</svg>`;

export const MapComponentInner: React.FC<Omit<MapComponentProps, 'apiKey'>> = ({
  drivers = [],
  initialCenter,
  initialZoom = 13,
  pickup: pickupProp = null,
  drop: dropProp = null,
  onPickupSelected,
  onDropSelected,
  drawRoute = false,
  className,
  style,
}) => {
  const map = useMap();
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [pickup, setPickup] = useState<LatLng | null>(pickupProp);
  const [drop, setDrop] = useState<LatLng | null>(dropProp);
  const [routePath, setRoutePath] = useState<LatLng[] | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const selectingPickupNextRef = useRef<boolean>(true);

  // Sync controlled props if they change
  useEffect(() => setPickup(pickupProp ?? null), [pickupProp?.lat, pickupProp?.lng]);
  useEffect(() => setDrop(dropProp ?? null), [dropProp?.lat, dropProp?.lng]);

  // Get user location
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const p = {lat: pos.coords.latitude, lng: pos.coords.longitude} as LatLng;
        setUserLoc(p);
      },
      () => {
        // ignore errors silently
      },
      {enableHighAccuracy: true, maximumAge: 10_000, timeout: 10_000}
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Fit bounds when key points change
  useEffect(() => {
    if (!map) return;
    const points: LatLng[] = [];
    if (userLoc) points.push(userLoc);
    if (pickup) points.push(pickup);
    if (drop) points.push(drop);
    // If no key points, use drivers to frame
    if (points.length === 0 && drivers && drivers.length > 0) {
      drivers.slice(0, 20).forEach((d) => points.push({lat: d.lat, lng: d.lng}));
    }
    if (points.length > 0) {
      fitMapBounds(map, points);
    }
  }, [map, userLoc?.lat, userLoc?.lng, pickup?.lat, pickup?.lng, drop?.lat, drop?.lng, drivers]);

  // Handle map click for selecting pickup/drop
  const handleMapClick = useCallback(
    (e: any) => {
      const latLng: LatLng | undefined = e?.detail?.latLng || e?.latLng;
      if (!latLng) return;
      if (selectingPickupNextRef.current) {
        setPickup(latLng);
        onPickupSelected?.(latLng);
        selectingPickupNextRef.current = false;
      } else {
        setDrop(latLng);
        onDropSelected?.(latLng);
        selectingPickupNextRef.current = true;
      }
    },
    [onPickupSelected, onDropSelected]
  );

  // Draw route using DirectionsService when pickup+drop+drawRoute
  useEffect(() => {
    if (!drawRoute || !pickup || !drop || !(window as any).google) {
      setRoutePath(null);
      return;
    }
    const directions = new google.maps.DirectionsService();
    directions.route(
      {
        origin: pickup,
        destination: drop,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
      },
      (res, status) => {
        if (status === 'OK' && res && res.routes[0]) {
          const path = res.routes[0].overview_path?.map((ll) => ({lat: ll.lat(), lng: ll.lng()})) ?? [];
          setRoutePath(path);
        } else {
          setRoutePath(null);
        }
      }
    );
  }, [drawRoute, pickup?.lat, pickup?.lng, drop?.lat, drop?.lng]);

  // Imperatively render the polyline on the map when route changes
  useEffect(() => {
    if (!map) return;
    // Clear if no route
    if (!routePath || routePath.length === 0) {
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
      return;
    }
    if (!polylineRef.current) {
      polylineRef.current = new google.maps.Polyline({
        path: routePath,
        strokeColor: '#1a73e8',
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map,
      });
    } else {
      polylineRef.current.setPath(routePath);
      if (!polylineRef.current.getMap()) polylineRef.current.setMap(map);
    }
    return () => {
      // optional cleanup when map or path changes
    };
  }, [map, routePath]);

  const center = useMemo<LatLng>(() => {
    if (initialCenter) return initialCenter;
    if (userLoc) return userLoc;
    if (drivers && drivers.length > 0) return {lat: drivers[0].lat, lng: drivers[0].lng};
    return {lat: 28.6139, lng: 77.209}; // Delhi fallback
  }, [initialCenter?.lat, initialCenter?.lng, userLoc?.lat, userLoc?.lng, drivers]);

  // Basic stats (distance/ETA) if both points are set
  const tripStats = useMemo(() => {
    if (!pickup || !drop) return null;
    const dist = calculateDistance(pickup.lat, pickup.lng, drop.lat, drop.lng);
    return {distanceKm: dist.toFixed(2)};
  }, [pickup?.lat, pickup?.lng, drop?.lat, drop?.lng]);

  return (
    <div className={className} style={{width: '100%', height: '100%', position: 'relative', ...(style || {})}}>
      <Map
        defaultCenter={center}
        defaultZoom={initialZoom}
        gestureHandling="greedy"
        disableDefaultUI={false}
        onClick={handleMapClick}
        style={{width: '100%', height: '100%'}}
      >
        {userLoc && (
          <Marker position={userLoc} icon={blueDotSvg} zIndex={200} />
        )}

        {pickup && (
          <Marker position={pickup} label={{text: 'Pickup', color: '#0a0a0a', fontWeight: '600'}} />
        )}
        {drop && (
          <Marker position={drop} label={{text: 'Drop', color: '#0a0a0a', fontWeight: '600'}} />
        )}

        {drivers && drivers.length > 0 && (
          <DriverMarkers drivers={drivers} />
        )}

        {/* Route polyline is drawn imperatively via Google Maps API in the effect below */}
      </Map>

      {tripStats && (
        <div style={{position: 'absolute', top: 12, left: 12, background: 'white', padding: '8px 10px', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)'}}>
          <div style={{fontWeight: 600}}>Trip</div>
          <div>Distance: {tripStats.distanceKm} km</div>
        </div>
      )}
    </div>
  );
};

export const MapComponent: React.FC<MapComponentProps> = ({apiKey, ...rest}) => {
  const key = apiKey || (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
  const useMapLibre = ((import.meta as any).env?.VITE_USE_MAPLIBRE ?? 'false') === 'true' || !key;

  if (useMapLibre) {
    // Basic wrapper to reuse the same props for a MapLibre fallback
    const {
      drivers = [],
      pickup = null,
      drop = null,
      style,
      drawRoute,
      initialCenter,
      initialZoom,
      onPickupSelected,
      onDropSelected,
      className,
      ...restProps
    } = rest as MapComponentProps & any;

  const height = typeof style?.height === 'number' ? style.height : 320;
  const driversArr: Driver[] = (drivers as Driver[]) || [];
  const mlDrivers: SimpleDriver[] = driversArr.map((d: Driver) => ({ id: d.id, lat: d.lat, lng: d.lng }));
    // Note: MapLibre fallback doesn't support click-to-select pickup/drop; show map with markers and optional route
    return (
      <div className={className} style={{ width: '100%', height: height }}>
        <MapLibreRideMap
          pickup={pickup || initialCenter || undefined}
          dropoff={drop || undefined}
          drivers={mlDrivers}
          autoFit={true}
          height={height}
          path={undefined}
        />
      </div>
    );
  }

  return (
    <APIProvider apiKey={key} solutionChannel="eco-ride-map-component">
      <MapComponentInner {...rest} />
    </APIProvider>
  );
};

export default MapComponent;
