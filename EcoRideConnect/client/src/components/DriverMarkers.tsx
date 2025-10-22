import React, {useEffect, useMemo, useRef} from 'react';
import {useMap} from '@vis.gl/react-google-maps';
import {MarkerClusterer} from '@googlemaps/markerclusterer';

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

export interface DriverMarkersProps {
  drivers: Driver[];
}

const carIcon = (color: string) =>
  `data:image/svg+xml;utf8,
<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24'>
  <path d='M5 11l1.5-4.5A2 2 0 018.4 5h7.2a2 2 0 011.9 1.5L19 11H5z' fill='${encodeURIComponent(
    color
  )}' />
  <path d='M4 11h16v6a1 1 0 01-1 1h-1a2 2 0 01-2-2H8a2 2 0 01-2 2H5a1 1 0 01-1-1v-6z' fill='${encodeURIComponent(
    color
  )}' fill-opacity='0.9' />
  <circle cx='7.5' cy='17' r='1.4' fill='%23000000' />
  <circle cx='16.5' cy='17' r='1.4' fill='%23000000' />
</svg>`;

const typeColor = (t: VehicleType) => {
  switch (t) {
    case 'E-Rickshaw':
      return '#10b981';
    case 'E-Scooter':
      return '#3b82f6';
    case 'CNG':
      return '#f59e0b';
    default:
      return '#3b82f6';
  }
};

export const DriverMarkers: React.FC<DriverMarkersProps> = ({drivers}) => {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Initialize clusterer when map available
  useEffect(() => {
    if (!map) return;
    clustererRef.current = new MarkerClusterer({map});
    infoWindowRef.current = new google.maps.InfoWindow();
    return () => {
      clustererRef.current?.clearMarkers();
      clustererRef.current = null;
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
      // Clean up markers
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current.clear();
    };
  }, [map]);

  // Smoothly move marker from old to new position
  const animateMarkerTo = (marker: google.maps.Marker, newPos: google.maps.LatLngLiteral) => {
    const start = marker.getPosition();
    if (!start) {
      marker.setPosition(newPos);
      return;
    }
    const startLat = start.lat();
    const startLng = start.lng();
    const endLat = newPos.lat;
    const endLng = newPos.lng;
    const duration = 400; // ms
    const startTime = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const lat = startLat + (endLat - startLat) * t;
      const lng = startLng + (endLng - startLng) * t;
      marker.setPosition({lat, lng});
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Update markers when drivers change
  useEffect(() => {
    if (!map || !clustererRef.current) return;

    const clusterer = clustererRef.current;
    const nextIds = new Set(drivers.filter((d) => d.is_available).map((d) => d.id));

    // Remove markers for drivers no longer present/available
    markersRef.current.forEach((marker, id) => {
      if (!nextIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });

    // Add/update markers for active drivers
    const newlyAdded: google.maps.Marker[] = [];

    drivers.forEach((d) => {
      if (!d.is_available) return;
      const pos = {lat: d.lat, lng: d.lng};
      const color = typeColor(d.vehicle_type);
      const icon = {url: carIcon(color), scaledSize: new google.maps.Size(28, 28)} as google.maps.Icon;

      const existing = markersRef.current.get(d.id);
      if (existing) {
        // update icon/position if changed
        existing.setIcon(icon);
        animateMarkerTo(existing, pos);
      } else {
        const marker = new google.maps.Marker({
          position: pos,
          icon,
          map,
          zIndex: 100,
        });
        marker.addListener('click', () => {
          if (!infoWindowRef.current) return;
          const content = `
            <div style="min-width:180px">
              <div style="font-weight:600;margin-bottom:4px;">${d.name || 'Driver ' + d.id}</div>
              <div style="font-size:12px;color:#374151;">Type: ${d.vehicle_type}</div>
              <div style="font-size:12px;color:#374151;">Rating: ${d.rating ?? '—'}</div>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open({anchor: marker, map});
        });
        markersRef.current.set(d.id, marker);
        newlyAdded.push(marker);
      }
    });

    if (newlyAdded.length > 0) {
      clusterer.addMarkers(newlyAdded, true);
    }
  }, [map, drivers]);

  return null;
};

export default DriverMarkers;
