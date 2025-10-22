import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Driver as MapDriver, VehicleType as MapVehicleType } from '@/components/MapComponent';

export type LatLng = { lat: number; lng: number };

function toMapVehicleType(v: 'e_rickshaw' | 'e_scooter' | 'cng_car'): MapVehicleType {
  switch (v) {
    case 'e_rickshaw': return 'E-Rickshaw';
    case 'e_scooter': return 'E-Scooter';
    case 'cng_car': return 'CNG';
    default: return 'E-Scooter';
  }
}

function jitterAround(center: LatLng, meters: number) {
  // Rough conversion: 1 deg lat ~111,320 m; 1 deg lng scales by cos(lat)
  const latConv = meters / 111320;
  const lngConv = meters / (111320 * Math.cos((center.lat * Math.PI) / 180));
  const rnd = (min: number, max: number) => Math.random() * (max - min) + min;
  return {
    lat: center.lat + rnd(-latConv, latConv),
    lng: center.lng + rnd(-lngConv, lngConv),
  };
}

export function useAvailableDriversNear(center: LatLng | null | undefined, radiusMeters = 800, refetchMs: number | false = 10000) {
  const { data } = useQuery<
    Array<{
      id: string;
      name: string;
      rating: string | number;
      vehicleNumber: string | null;
      vehicleType: 'e_rickshaw' | 'e_scooter' | 'cng_car';
      estimatedArrival: number;
      fare?: number;
    }>
  >({
    queryKey: ['/api/rider/available-drivers'],
    enabled: !!center,
    refetchInterval: refetchMs,
  });

  const drivers: MapDriver[] = useMemo(() => {
    if (!center || !data) return [];
    return data.map((d, idx) => {
      const pos = jitterAround(center, Math.max(150, (idx % 5) * (radiusMeters / 6)));
      return {
        id: d.id,
        lat: pos.lat,
        lng: pos.lng,
        is_available: true,
        vehicle_type: toMapVehicleType(d.vehicleType),
        name: d.name,
        rating: typeof d.rating === 'string' ? parseFloat(d.rating) : d.rating,
      } satisfies MapDriver;
    });
  }, [JSON.stringify(center), data, radiusMeters]);

  return drivers;
}
