/**
 * Socket.IO Service for Real-time Location and Ride Updates
 * Handles live tracking, notifications, and instant ride events
 */

import { io, Socket } from 'socket.io-client';
import type { LatLng } from './mapService';

export interface RideRequest {
  riderId: string;
  pickup: LatLng & { address: string };
  drop: LatLng & { address: string };
  vehicleType: 'auto' | 'bike' | 'car';
  fare: number;
  distance: number;
}

export interface RideDetails extends RideRequest {
  id: string;
  driverId?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface DriverLocation {
  driverId: string;
  location: LatLng;
  vehicleType: 'auto' | 'bike' | 'car';
  isAvailable: boolean;
  rating: number;
  timestamp: number;
}

let socket: Socket | null = null;

/**
 * Initialize Socket.IO connection
 */
export const initSocket = (
  userId: string,
  userType: 'rider' | 'driver' | 'admin'
): Socket => {
  const socketServer = import.meta.env.VITE_SOCKET_SERVER || 'http://localhost:5000';
  
  if (socket?.connected) {
    return socket;
  }
  
  socket = io(socketServer, {
    auth: { userId, userType },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  
  // Connection event handlers
  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });
  
  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error);
  });
  
  return socket;
};

/**
 * Get current socket instance
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// ==================== DRIVER EVENTS ====================

/**
 * Send driver location update
 */
export const sendDriverLocationUpdate = (
  driverId: string,
  location: LatLng
): void => {
  if (!socket) return;
  
  socket.emit('driver_location_update', {
    driverId,
    location,
    timestamp: Date.now(),
  });
};

/**
 * Update driver online status
 */
export const updateDriverStatus = (
  driverId: string,
  isAvailable: boolean
): void => {
  if (!socket) return;
  
  socket.emit('driver_status_update', {
    driverId,
    isAvailable,
    timestamp: Date.now(),
  });
};

/**
 * Accept ride request (driver)
 */
export const acceptRideRequest = (
  rideId: string,
  driverId: string
): void => {
  if (!socket) return;
  
  socket.emit('ride_accept', {
    rideId,
    driverId,
    timestamp: Date.now(),
  });
};

/**
 * Reject ride request (driver)
 */
export const rejectRideRequest = (
  rideId: string,
  driverId: string,
  reason?: string
): void => {
  if (!socket) return;
  
  socket.emit('ride_reject', {
    rideId,
    driverId,
    reason,
    timestamp: Date.now(),
  });
};

/**
 * Start ride (driver)
 */
export const startRide = (rideId: string): void => {
  if (!socket) return;
  
  socket.emit('ride_start', {
    rideId,
    timestamp: Date.now(),
  });
};

/**
 * Complete ride (driver)
 */
export const completeRide = (rideId: string): void => {
  if (!socket) return;
  
  socket.emit('ride_complete', {
    rideId,
    timestamp: Date.now(),
  });
};

/**
 * Listen for ride requests (driver)
 */
export const onRideRequest = (
  callback: (ride: RideDetails) => void
): void => {
  if (!socket) return;
  
  socket.on('new_ride_request', callback);
};

/**
 * Remove ride request listener
 */
export const offRideRequest = (): void => {
  if (!socket) return;
  socket.off('new_ride_request');
};

// ==================== RIDER EVENTS ====================

/**
 * Request a ride (rider)
 */
export const requestRide = (rideRequest: RideRequest): void => {
  if (!socket) return;
  
  socket.emit('ride_request', {
    ...rideRequest,
    timestamp: Date.now(),
  });
};

/**
 * Cancel ride (rider)
 */
export const cancelRide = (rideId: string, reason?: string): void => {
  if (!socket) return;
  
  socket.emit('ride_cancel', {
    rideId,
    reason,
    timestamp: Date.now(),
  });
};

/**
 * Listen for driver assignment (rider)
 */
export const onDriverAssigned = (
  callback: (data: { rideId: string; driver: DriverLocation }) => void
): void => {
  if (!socket) return;
  
  socket.on('driver_assigned', callback);
};

/**
 * Listen for driver location updates during ride (rider)
 */
export const onDriverLocationUpdate = (
  callback: (location: LatLng) => void
): void => {
  if (!socket) return;
  
  socket.on('driver_location', callback);
};

/**
 * Listen for ride status updates (rider)
 */
export const onRideStatusUpdate = (
  callback: (status: RideDetails) => void
): void => {
  if (!socket) return;
  
  socket.on('ride_status_update', callback);
};

/**
 * Remove rider event listeners
 */
export const removeRiderListeners = (): void => {
  if (!socket) return;
  
  socket.off('driver_assigned');
  socket.off('driver_location');
  socket.off('ride_status_update');
};

// ==================== ADMIN EVENTS ====================

/**
 * Request all active drivers (admin)
 */
export const requestAllDrivers = (): void => {
  if (!socket) return;
  socket.emit('request_all_drivers');
};

/**
 * Listen for all drivers locations (admin)
 */
export const onAllDriversLocations = (
  callback: (drivers: DriverLocation[]) => void
): void => {
  if (!socket) return;
  
  socket.on('all_drivers_locations', callback);
};

/**
 * Listen for all active rides (admin)
 */
export const onAllActiveRides = (
  callback: (rides: RideDetails[]) => void
): void => {
  if (!socket) return;
  
  socket.on('all_active_rides', callback);
};

/**
 * Listen for platform metrics (admin)
 */
export const onPlatformMetrics = (
  callback: (metrics: {
    activeDrivers: number;
    activeRiders: number;
    ongoingRides: number;
    todayRevenue: number;
  }) => void
): void => {
  if (!socket) return;
  
  socket.on('platform_metrics', callback);
};

/**
 * Remove admin event listeners
 */
export const removeAdminListeners = (): void => {
  if (!socket) return;
  
  socket.off('all_drivers_locations');
  socket.off('all_active_rides');
  socket.off('platform_metrics');
};

// ==================== COMMON EVENTS ====================

/**
 * Listen for errors
 */
export const onError = (callback: (error: { message: string; code?: string }) => void): void => {
  if (!socket) return;
  socket.on('error', callback);
};

/**
 * Listen for notifications
 */
export const onNotification = (
  callback: (notification: { type: string; message: string; data?: any }) => void
): void => {
  if (!socket) return;
  socket.on('notification', callback);
};

/**
 * Start driver location tracking (sends updates every 10 seconds)
 */
export const startDriverLocationTracking = (
  driverId: string,
  getCurrentLocation: () => LatLng
): (() => void) => {
  const intervalId = setInterval(() => {
    const location = getCurrentLocation();
    sendDriverLocationUpdate(driverId, location);
  }, 10000); // Send update every 10 seconds
  
  // Return cleanup function
  return () => clearInterval(intervalId);
};

/**
 * Emit custom event
 */
export const emitEvent = (eventName: string, data: any): void => {
  if (!socket) return;
  socket.emit(eventName, data);
};

/**
 * Listen to custom event
 */
export const onEvent = (eventName: string, callback: (...args: any[]) => void): void => {
  if (!socket) return;
  socket.on(eventName, callback);
};

/**
 * Remove listener for custom event
 */
export const offEvent = (eventName: string, callback?: (...args: any[]) => void): void => {
  if (!socket) return;
  if (callback) {
    socket.off(eventName, callback);
  } else {
    socket.off(eventName);
  }
};

/**
 * Check if socket is connected
 */
export const isSocketConnected = (): boolean => {
  return socket?.connected || false;
};
