import { WebSocket } from 'ws';
import { storage } from '../storage';
import { haversineDistanceKm } from '../utils/location';
import { getDriverSocket, getOnlineDriversByVehicle, type VehicleType } from '../presence';

type ScoreInputs = {
  distanceKm: number;
  radiusKm: number;
  rating: number; // 0..5
  completionRate: number; // 0..1
  comfort: number; // 0..1
};

type DriverCandidate = {
  id: string;
  name: string;
  rating: number; // 0..5
  totalRides: number;
  completionRate: number; // best effort
  vehicleType: VehicleType;
  lat: number;
  lng: number;
  distanceKm: number;
  score: number;
};

function comfortForVehicle(v: VehicleType): number {
  switch (v) {
    case 'cng_car': return 1.0;
    case 'e_rickshaw': return 0.8;
    case 'e_scooter': return 0.6;
    default: return 0.7;
  }
}

function scoreDriver({ distanceKm, radiusKm, rating, completionRate, comfort }: ScoreInputs): number {
  // Normalize distance: closer is better. 1 at 0km, 0 at radius boundary.
  const distanceScore = Math.max(0, 1 - distanceKm / Math.max(radiusKm, 0.001));
  const ratingScore = Math.min(1, Math.max(0, rating / 5));
  const completionScore = Math.min(1, Math.max(0, completionRate));
  const comfortScore = Math.min(1, Math.max(0, comfort));
  // Weights: distance 60%, rating 20%, completion 10%, comfort 10%
  return 0.6 * distanceScore + 0.2 * ratingScore + 0.1 * completionScore + 0.1 * comfortScore;
}

export async function findTopDrivers(
  pickupLat: number,
  pickupLng: number,
  vehicleType: VehicleType,
  radiusKm: number,
): Promise<DriverCandidate[]> {
  const online = getOnlineDriversByVehicle(vehicleType);
  if (!online.length) return [];

  const avail = await storage.listAvailableDrivers();
  const byId = new Map(avail.map((d) => [d.id, d]));
  const profilesArr = await Promise.all(
    online.map((p) => storage.getDriverProfile(p.userId).catch(() => null)),
  );
  const profiles = new Map(online.map((p, i) => [p.userId, profilesArr[i]]));

  const candidates: DriverCandidate[] = online
    .map((p) => {
  const db = byId.get(p.userId);
  const prof: any = profiles.get(p.userId) || null;
  const ratingNum = db?.rating ? Number(db.rating) : prof?.rating ? Number(prof.rating) : p.rating ?? 4.5;
  const totalRides = prof?.totalRides ?? 0;
      // We don't have completion rate; approximate from rides or default 0.85
      const completionRate = totalRides > 0 ? Math.min(0.99, 0.8 + Math.min(0.19, totalRides / 1000)) : 0.85;
      const distanceKm = haversineDistanceKm(pickupLat, pickupLng, p.lat!, p.lng!);
      if (distanceKm > radiusKm) return null;
      const comfort = comfortForVehicle((db?.vehicleType as VehicleType) || (prof?.vehicleType as VehicleType) || (p.vehicleType as VehicleType));
      const score = scoreDriver({ distanceKm, radiusKm, rating: ratingNum, completionRate, comfort });
      return {
        id: p.userId,
        name: db?.name || 'Driver',
        rating: isNaN(ratingNum) ? 4.5 : ratingNum,
        totalRides,
        completionRate,
        vehicleType: (db?.vehicleType as VehicleType) || (prof?.vehicleType as VehicleType) || (p.vehicleType as VehicleType),
        lat: p.lat!,
        lng: p.lng!,
        distanceKm,
        score,
      } as DriverCandidate;
    })
    .filter(Boolean) as DriverCandidate[];

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 10);
}

export async function notifyDrivers(
  ride: { id: string; pickupLat: number; pickupLng: number; dropoffLat: number; dropoffLng: number; vehicleType: VehicleType; estimatedFare?: number },
  drivers: DriverCandidate[],
  maxNotify = 3,
) {
  const toNotify = drivers.slice(0, maxNotify);
  for (const d of toNotify) {
    const sock = getDriverSocket(d.id);
    if (sock && sock.readyState === WebSocket.OPEN) {
      sock.send(
        JSON.stringify({
          type: 'ride_request',
          rideId: ride.id,
          pickupLat: ride.pickupLat,
          pickupLng: ride.pickupLng,
          dropoffLat: ride.dropoffLat,
          dropoffLng: ride.dropoffLng,
          vehicleType: ride.vehicleType,
          estimatedFare: ride.estimatedFare,
          distanceKm: d.distanceKm,
          at: Date.now(),
        }),
      );
    }
  }
  return toNotify.map((d) => d.id);
}

export async function initiateRideMatching(
  app: any,
  rideId: string,
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number,
  vehicleType: VehicleType,
  estimatedFare?: number,
) {
  const wss: any = app?.locals?.wss;

  const broadcast = (payload: any) => {
    if (!wss) return;
    const data = JSON.stringify(payload);
    wss.clients.forEach((client: any) => {
      if (client.readyState === WebSocket.OPEN) client.send(data);
    });
  };

  // Helper to read ride status
  async function isRidePending() {
    const latest = await storage.getRide(rideId);
    return latest && latest.status === 'pending';
  }

  // Phase 1: 5km radius
  broadcast({ type: 'matching_update', rideId, phase: 'initial', radiusKm: 5, at: Date.now() });
  const topDrivers5 = await findTopDrivers(pickupLat, pickupLng, vehicleType, 5);
  const notified = new Set<string>(await notifyDrivers({ id: rideId, pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType, estimatedFare }, topDrivers5, 3));

  // Wait up to 30s for acceptance
  setTimeout(async () => {
    if (!(await isRidePending())) return;

    // Phase 2: expand to 7km
    broadcast({ type: 'matching_update', rideId, phase: 'expanded', radiusKm: 7, at: Date.now() });
    const topDrivers7 = await findTopDrivers(pickupLat, pickupLng, vehicleType, 7);
    const more = topDrivers7.filter((d) => !notified.has(d.id));
    await notifyDrivers({ id: rideId, pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType, estimatedFare }, more, 3);

    // Final timeout another 30s
    setTimeout(async () => {
      if (!(await isRidePending())) return;
      broadcast({ type: 'ride_timeout', rideId, at: Date.now() });
    }, 30_000);
  }, 30_000);
}
