export type LatLngLike = {lat: number; lng: number};
export type VehicleType = 'E-Rickshaw' | 'E-Scooter' | 'CNG';

// Haversine distance in kilometers
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function estimateFare(distanceKm: number, vehicleType: VehicleType): number {
  const rates: Record<VehicleType, {base: number; perKm: number}> = {
    'E-Rickshaw': {base: 20, perKm: 10},
    'E-Scooter': {base: 15, perKm: 12},
    CNG: {base: 25, perKm: 14},
  };
  const {base, perKm} = rates[vehicleType] ?? rates['E-Scooter'];
  const fare = base + perKm * Math.max(0, distanceKm);
  return Math.round(fare * 100) / 100;
}

export function getETA(distanceKm: number, traffic: 'low' | 'medium' | 'high' = 'medium'): number {
  const speedKmh = traffic === 'low' ? 30 : traffic === 'high' ? 15 : 22; // rough averages
  const hours = distanceKm / Math.max(5, speedKmh); // avoid div by very small
  return Math.ceil(hours * 60);
}

export async function geocodeAddress(address: string, apiKey?: string): Promise<LatLngLike | null> {
  const key = apiKey || (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('key', key);
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = await res.json();
  const loc = data?.results?.[0]?.geometry?.location;
  return loc ? {lat: loc.lat, lng: loc.lng} : null;
}

export async function reverseGeocode(lat: number, lng: number, apiKey?: string): Promise<string | null> {
  const key = apiKey || (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('latlng', `${lat},${lng}`);
  url.searchParams.set('key', key);
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = await res.json();
  return data?.results?.[0]?.formatted_address ?? null;
}

export function fitMapBounds(map: google.maps.Map, points: LatLngLike[]): void {
  if (!map || !points || points.length === 0) return;
  const bounds = new google.maps.LatLngBounds();
  points.forEach((p) => bounds.extend(p));
  map.fitBounds(bounds, 48); // padding around edges
}
