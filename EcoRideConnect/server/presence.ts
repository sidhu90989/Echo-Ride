import type { WebSocket } from 'ws';

export type VehicleType = 'e_rickshaw' | 'e_scooter' | 'cng_car';

export type DriverPresence = {
  userId: string;
  isOnline: boolean;
  lat?: number;
  lng?: number;
  vehicleType?: VehicleType;
  rating?: number;
  socket?: WebSocket;
  updatedAt: number;
};

const drivers = new Map<string, DriverPresence>();
const socketToUser = new WeakMap<WebSocket, string>();

export function registerDriverSocket(userId: string, ws: WebSocket) {
  const prev = drivers.get(userId) || ({ userId, isOnline: false, updatedAt: Date.now() } as DriverPresence);
  prev.socket = ws;
  drivers.set(userId, prev);
  socketToUser.set(ws, userId);
}

export function unregisterSocket(ws: WebSocket) {
  const uid = socketToUser.get(ws);
  if (!uid) return;
  const p = drivers.get(uid);
  if (p && p.socket === ws) {
    p.socket = undefined;
    p.isOnline = false;
    p.updatedAt = Date.now();
    drivers.set(uid, p);
  }
}

export function setDriverOnline(userId: string, online: boolean, lat?: number, lng?: number, vehicleType?: VehicleType, rating?: number) {
  const cur = drivers.get(userId) || ({ userId, isOnline: false, updatedAt: Date.now() } as DriverPresence);
  cur.isOnline = online;
  if (lat != null && lng != null) {
    cur.lat = lat;
    cur.lng = lng;
  }
  if (vehicleType) cur.vehicleType = vehicleType;
  if (rating != null) cur.rating = rating;
  cur.updatedAt = Date.now();
  drivers.set(userId, cur);
  return cur;
}

export function updateDriverLocation(userId: string, lat: number, lng: number) {
  const cur = drivers.get(userId);
  if (!cur) return;
  cur.lat = lat; cur.lng = lng; cur.updatedAt = Date.now();
}

export function getOnlineDriversByVehicle(type: VehicleType) {
  return Array.from(drivers.values()).filter((d) => d.isOnline && !!d.lat && !!d.lng && d.vehicleType === type);
}

export function getDriverSocket(userId: string): WebSocket | undefined {
  return drivers.get(userId)?.socket;
}

export function getPresence(userId: string): DriverPresence | undefined {
  return drivers.get(userId);
}
