import { storage } from '../storage';
import { haversineDistanceKm } from '../utils/location';
import { getOnlineDriversByVehicle } from '../presence';

export type NearestDriver = {
  id: string;
  name: string;
  rating: number;
  vehicleNumber: string | null;
  vehicleType: 'e_rickshaw' | 'e_scooter' | 'cng_car';
  lat: number;
  lng: number;
  distanceKm: number;
};

export async function findNearestDrivers(pickupLat: number, pickupLng: number, vehicleType: 'e_rickshaw' | 'e_scooter' | 'cng_car', maxDistanceKm = 10): Promise<NearestDriver[]> {
  // Get currently online drivers with coords from presence registry
  const online = getOnlineDriversByVehicle(vehicleType);
  if (!online.length) return [];

  // Enrich with DB info (name, rating, vehicleNumber) using storage.listAvailableDrivers
  const avail = await storage.listAvailableDrivers();
  const byId = new Map(avail.map((d) => [d.id, d]));

  const withDistance: NearestDriver[] = online.map((p) => {
    const db = byId.get(p.userId);
    const ratingNum = db?.rating ? Number(db.rating) : p.rating ?? 5;
    const dist = haversineDistanceKm(pickupLat, pickupLng, p.lat!, p.lng!);
    return {
      id: p.userId,
      name: db?.name || 'Driver',
      rating: isNaN(ratingNum) ? 5 : ratingNum,
      vehicleNumber: db?.vehicleNumber ?? null,
      vehicleType: db?.vehicleType ?? (p.vehicleType as any),
      lat: p.lat!,
      lng: p.lng!,
      distanceKm: dist,
    };
  }).filter((d) => d.distanceKm <= maxDistanceKm);

  // Sort by distance then by rating desc
  withDistance.sort((a, b) => a.distanceKm - b.distanceKm || b.rating - a.rating);
  return withDistance.slice(0, 5);
}
