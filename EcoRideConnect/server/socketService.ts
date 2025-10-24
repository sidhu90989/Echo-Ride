/**
 * Socket.IO Service for Real-Time Ride Management
 * Handles driver locations, ride requests, and live updates
 */

import { Server as SocketIOServer } from 'socket.io';
import type { Server } from 'http';
import { db } from './db';
import { rides, driverProfiles, users } from '../shared/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';

// Helper to ensure db is available
function getDb() {
  if (!db) {
    throw new Error('Database connection not initialized');
  }
  return db;
}

// Types for Socket.IO events
interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
}

interface RideRequest {
  riderId: string;
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  drop: {
    lat: number;
    lng: number;
    address: string;
  };
  vehicleType: 'auto' | 'bike' | 'car';
  distance: number;
  fare: number;
  estimatedTime: number;
}

interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  rating: number;
  location: DriverLocation;
  status: 'online' | 'offline' | 'on_ride';
}

interface RideDetails {
  id: string;
  riderId: string;
  driverId?: string;
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  drop: {
    lat: number;
    lng: number;
    address: string;
  };
  vehicleType: string;
  fare: number;
  distance: number;
  status: string;
  driver?: DriverInfo;
}

// In-memory stores for real-time data
const onlineDrivers = new Map<string, {
  socketId: string;
  userId: string;
  location: DriverLocation;
  status: 'online' | 'on_ride';
  lastUpdate: number;
}>();

// In-memory driver traces (last N points) for live path/history visualizations
const driverTraces = new Map<string, Array<{ lat: number; lng: number; timestamp: number }>>();
const TRACE_LIMIT = 500;

const activeRides = new Map<string, {
  rideId: string;
  riderId: string;
  driverId: string;
  riderSocketId?: string;
  driverSocketId?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed';
}>();

const pendingRideRequests = new Map<string, {
  rideRequest: RideRequest;
  requestedDrivers: Set<string>;
  timeout: NodeJS.Timeout;
}>();

// Platform metrics
const platformMetrics = {
  totalDrivers: 0,
  activeDrivers: 0,
  activeRides: 0,
  todayRevenue: 0,
  todayRides: 0,
  avgResponseTime: 0,
};

/**
 * Initialize Socket.IO server
 */
export function initializeSocketIO(httpServer: Server) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN?.split(',').map(s => s.trim()) || '*',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  console.log('🔌 Socket.IO server initialized');

  // Authentication middleware
  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    const userType = socket.handshake.auth.userType; // 'rider', 'driver', 'admin'
    
    if (!userId || !userType) {
      return next(new Error('Authentication required'));
    }
    
    socket.data.userId = userId;
    socket.data.userType = userType;
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    const userType = socket.data.userType;
    
    console.log(`✅ ${userType} connected: ${userId}`);

    // ==================== DRIVER EVENTS ====================
    
    if (userType === 'driver') {
      // Backward-compat: accept generic client events and map to namespaced ones
      socket.on('driver_status_update', async (data: { driverId: string; isAvailable: boolean; location?: DriverLocation }) => {
        try {
          if (data?.isAvailable) {
            // Bring driver online and store initial location if provided
            const initialLoc: DriverLocation = data.location || onlineDrivers.get(userId)?.location || { lat: 0, lng: 0 };
            onlineDrivers.set(userId, {
              socketId: socket.id,
              userId,
              location: initialLoc,
              status: 'online',
              lastUpdate: Date.now(),
            });
            platformMetrics.activeDrivers = onlineDrivers.size;
            io.to('admin-room').emit('driver:status_changed', { driverId: userId, status: 'online', location: initialLoc });
          } else {
            onlineDrivers.delete(userId);
            platformMetrics.activeDrivers = onlineDrivers.size;
            io.to('admin-room').emit('driver:status_changed', { driverId: userId, status: 'offline' });
          }
        } catch (err) {
          console.warn('driver_status_update handling failed:', err);
        }
      });
      socket.on('driver_location_update', (data: { driverId: string; location: DriverLocation; timestamp?: number }) => {
        // Handle inline (do not re-emit)
        const driver = onlineDrivers.get(userId);
        if (driver) {
          driver.location = data.location;
          driver.lastUpdate = Date.now();
          const arr = driverTraces.get(userId) || [];
          arr.push({ lat: data.location.lat, lng: data.location.lng, timestamp: Date.now() });
          if (arr.length > TRACE_LIMIT) arr.splice(0, arr.length - TRACE_LIMIT);
          driverTraces.set(userId, arr);
          io.to('admin-room').emit('driver:location_update', { driverId: userId, location: data.location });
        }
      });

      // Driver comes online
      socket.on('driver:online', async (data: { location: DriverLocation }) => {
        onlineDrivers.set(userId, {
          socketId: socket.id,
          userId,
          location: data.location,
          status: 'online',
          lastUpdate: Date.now(),
        });
        
        // Update database
        try {
          await getDb().update(driverProfiles)
            .set({ isAvailable: true, updatedAt: new Date() })
            .where(eq(driverProfiles.userId, userId));
        } catch (error) {
          console.error('Error updating driver status:', error);
        }
        
        platformMetrics.activeDrivers = onlineDrivers.size;
        
        // Broadcast to admin
        io.to('admin-room').emit('driver:status_changed', {
          driverId: userId,
          status: 'online',
          location: data.location,
        });
        
        console.log(`🟢 Driver ${userId} is now online`);
      });

      // Driver goes offline
      socket.on('driver:offline', async () => {
        onlineDrivers.delete(userId);
        
        try {
          await getDb().update(driverProfiles)
            .set({ isAvailable: false, updatedAt: new Date() })
            .where(eq(driverProfiles.userId, userId));
        } catch (error) {
          console.error('Error updating driver status:', error);
        }
        
        platformMetrics.activeDrivers = onlineDrivers.size;
        
        io.to('admin-room').emit('driver:status_changed', {
          driverId: userId,
          status: 'offline',
        });
        
        console.log(`⚪ Driver ${userId} is now offline`);
      });

      // Driver location update
      socket.on('driver:location_update', (data: { location: DriverLocation }) => {
        const driver = onlineDrivers.get(userId);
        if (driver) {
          driver.location = data.location;
          driver.lastUpdate = Date.now();

          // Append to in-memory trace
          const arr = driverTraces.get(userId) || [];
          arr.push({ lat: data.location.lat, lng: data.location.lng, timestamp: Date.now() });
          if (arr.length > TRACE_LIMIT) arr.splice(0, arr.length - TRACE_LIMIT);
          driverTraces.set(userId, arr);
          
          // If driver is on a ride, update rider
          activeRides.forEach((ride, rideId) => {
            if (ride.driverId === userId && ride.riderSocketId) {
              io.to(ride.riderSocketId).emit('ride:driver_location', {
                location: data.location,
              });
            }
          });
          
          // Broadcast to admin
          io.to('admin-room').emit('driver:location_update', {
            driverId: userId,
            location: data.location,
          });
        }
      });

      // Admin/debug: provide all online drivers snapshot
      socket.on('request_all_drivers', () => {
        const snapshot = Array.from(onlineDrivers.values()).map((d) => ({
          id: d.userId,
          name: '',
          phone: '',
          vehicleType: '',
          vehicleNumber: '',
          rating: 0,
          location: d.location,
          status: d.status,
        }));
        socket.emit('all_drivers_locations', snapshot as any);
      });

      // Optional: return recent trace for a driver
      socket.on('request_driver_trace', (data: { driverId: string }) => {
        const items = driverTraces.get(data.driverId) || [];
        socket.emit('driver_trace', { driverId: data.driverId, points: items });
      });

      // Driver accepts ride
      socket.on('ride:accept', async (data: { rideId: string }) => {
        const { rideId } = data;
        
        if (!db) {
          socket.emit('error', { message: 'Database not available' });
          return;
        }
        
        try {
          // Update ride in database
          await getDb().update(rides)
            .set({
              driverId: userId,
              status: 'accepted',
              acceptedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(rides.id, rideId));
          
          // Get driver info
          const [driverInfo] = await db
            .select({
              name: users.name,
              phone: users.phone,
              vehicleType: driverProfiles.vehicleType,
              vehicleNumber: driverProfiles.vehicleNumber,
              rating: driverProfiles.rating,
            })
            .from(users)
            .innerJoin(driverProfiles, eq(driverProfiles.userId, users.id))
            .where(eq(users.id, userId));
          
          // Get ride details
          const [ride] = await db
            .select()
            .from(rides)
            .where(eq(rides.id, rideId));
          
          if (!ride) {
            socket.emit('error', { message: 'Ride not found' });
            return;
          }
          
          // Update active rides map
          let rideData = activeRides.get(rideId);
          if (!rideData) {
            rideData = {
              rideId,
              riderId: ride.riderId,
              driverId: userId,
              status: 'accepted',
            };
            activeRides.set(rideId, rideData);
          }
          rideData.driverId = userId;
          rideData.driverSocketId = socket.id;
          rideData.status = 'accepted';
          
          // Update driver status
          const driver = onlineDrivers.get(userId);
          if (driver) {
            driver.status = 'on_ride';
          }
          
          platformMetrics.activeRides = activeRides.size;
          
          // Notify rider
          if (rideData.riderSocketId) {
            const driverLocation = driver?.location;
            io.to(rideData.riderSocketId).emit('ride:driver_assigned', {
              driver: {
                id: userId,
                ...driverInfo,
                location: driverLocation,
              },
              rideId,
            });
          }
          
          // Cancel pending request timeout
          const pendingRequest = pendingRideRequests.get(rideId);
          if (pendingRequest) {
            clearTimeout(pendingRequest.timeout);
            pendingRideRequests.delete(rideId);
          }
          
          // Notify admin
          io.to('admin-room').emit('ride:accepted', {
            rideId,
            driverId: userId,
            riderId: ride.riderId,
          });
          
          console.log(`✅ Driver ${userId} accepted ride ${rideId}`);
        } catch (error) {
          console.error('Error accepting ride:', error);
          socket.emit('error', { message: 'Failed to accept ride' });
        }
      });

      // Driver rejects ride
      socket.on('ride:reject', async (data: { rideId: string; reason?: string }) => {
        const { rideId } = data;
        
        console.log(`❌ Driver ${userId} rejected ride ${rideId}`);
        
        // Find next available driver
        await findNextAvailableDriver(rideId, userId);
      });

      // Driver starts ride (picked up customer)
      socket.on('ride:start', async (data: { rideId: string }) => {
        const { rideId } = data;
        
        if (!db) return;
        
        try {
          await getDb().update(rides)
            .set({
              status: 'in_progress',
              startedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(rides.id, rideId));
          
          const rideData = activeRides.get(rideId);
          if (rideData) {
            rideData.status = 'in_progress';
            
            if (rideData.riderSocketId) {
              io.to(rideData.riderSocketId).emit('ride:started', { rideId });
            }
          }
          
          io.to('admin-room').emit('ride:started', { rideId });
          
          console.log(`🚗 Ride ${rideId} started`);
        } catch (error) {
          console.error('Error starting ride:', error);
        }
      });

      // Driver completes ride
      socket.on('ride:complete', async (data: { rideId: string }) => {
        const { rideId } = data;
        
        if (!db) return;
        
        try {
          const [ride] = await db
            .select()
            .from(rides)
            .where(eq(rides.id, rideId));
          
          if (!ride) return;
          
          await getDb().update(rides)
            .set({
              status: 'completed',
              completedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(rides.id, rideId));
          
          // Update driver stats
          await getDb().update(driverProfiles)
            .set({
              totalRides: sql`${driverProfiles.totalRides} + 1`,
              totalEarnings: sql`${driverProfiles.totalEarnings} + ${ride.actualFare || ride.estimatedFare}`,
              updatedAt: new Date(),
            })
            .where(eq(driverProfiles.userId, userId));
          
          const rideData = activeRides.get(rideId);
          if (rideData) {
            if (rideData.riderSocketId) {
              io.to(rideData.riderSocketId).emit('ride:completed', { rideId });
            }
            activeRides.delete(rideId);
          }
          
          // Driver back to online
          const driver = onlineDrivers.get(userId);
          if (driver) {
            driver.status = 'online';
          }
          
          platformMetrics.activeRides = activeRides.size;
          platformMetrics.todayRides += 1;
          platformMetrics.todayRevenue += Number(ride.actualFare || ride.estimatedFare || 0);
          
          io.to('admin-room').emit('ride:completed', { rideId });
          io.to('admin-room').emit('platform:metrics', platformMetrics);
          
          console.log(`✅ Ride ${rideId} completed`);
        } catch (error) {
          console.error('Error completing ride:', error);
        }
      });
    }

    // ==================== RIDER EVENTS ====================
    
    if (userType === 'rider') {
      // Rider requests a ride
      socket.on('ride:request', async (rideRequest: RideRequest) => {
        try {
          console.log(`🚕 Ride request from rider ${userId}:`, rideRequest);
          
          // Create ride in database
          const [newRide] = await getDb().insert(rides).values({
            riderId: userId,
            pickupLocation: rideRequest.pickup.address,
            pickupLat: rideRequest.pickup.lat.toString(),
            pickupLng: rideRequest.pickup.lng.toString(),
            dropoffLocation: rideRequest.drop.address,
            dropoffLat: rideRequest.drop.lat.toString(),
            dropoffLng: rideRequest.drop.lng.toString(),
            vehicleType: rideRequest.vehicleType as 'e_rickshaw' | 'e_scooter' | 'cng_car',
            distance: rideRequest.distance.toString(),
            estimatedFare: rideRequest.fare.toString(),
            status: 'pending',
          }).returning();
          
          if (!newRide) {
            socket.emit('error', { message: 'Failed to create ride' });
            return;
          }
          
          // Store active ride
          activeRides.set(newRide.id, {
            rideId: newRide.id,
            riderId: userId,
            driverId: '',
            riderSocketId: socket.id,
            status: 'pending',
          });
          
          // Find nearby drivers
          const nearbyDrivers = await findNearbyDrivers(
            rideRequest.pickup.lat,
            rideRequest.pickup.lng,
            rideRequest.vehicleType,
            5000 // 5km radius
          );
          
          if (nearbyDrivers.length === 0) {
            socket.emit('ride:no_drivers', { message: 'No drivers available nearby' });
            await getDb().update(rides)
              .set({ status: 'cancelled', cancelledAt: new Date() })
              .where(eq(rides.id, newRide.id));
            activeRides.delete(newRide.id);
            return;
          }
          
          // Send ride request to nearest driver
          const rideDetails: RideDetails = {
            id: newRide.id,
            riderId: userId,
            pickup: rideRequest.pickup,
            drop: rideRequest.drop,
            vehicleType: rideRequest.vehicleType,
            fare: rideRequest.fare,
            distance: rideRequest.distance,
            status: 'pending',
          };
          
          // Store pending request
          const timeout = setTimeout(() => {
            // No driver accepted, try next
            findNextAvailableDriver(newRide.id);
          }, 30000); // 30 seconds timeout
          
          pendingRideRequests.set(newRide.id, {
            rideRequest,
            requestedDrivers: new Set([nearbyDrivers[0].userId]),
            timeout,
          });
          
          // Send to first driver
          const firstDriver = onlineDrivers.get(nearbyDrivers[0].userId);
          if (firstDriver) {
            io.to(firstDriver.socketId).emit('ride:request', rideDetails);
          }
          
          console.log(`📤 Ride request sent to driver ${nearbyDrivers[0].userId}`);
          
        } catch (error) {
          console.error('Error creating ride:', error);
          socket.emit('error', { message: 'Failed to create ride' });
        }
      });

      // Rider cancels ride
      socket.on('ride:cancel', async (data: { rideId: string }) => {
        const { rideId } = data;
        
        try {
          await getDb().update(rides)
            .set({
              status: 'cancelled',
              cancelledAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(rides.id, rideId));
          
          const rideData = activeRides.get(rideId);
          if (rideData) {
            if (rideData.driverSocketId) {
              io.to(rideData.driverSocketId).emit('ride:cancelled', { rideId });
            }
            activeRides.delete(rideId);
          }
          
          // Clear pending request
          const pendingRequest = pendingRideRequests.get(rideId);
          if (pendingRequest) {
            clearTimeout(pendingRequest.timeout);
            pendingRideRequests.delete(rideId);
          }
          
          platformMetrics.activeRides = activeRides.size;
          
          io.to('admin-room').emit('ride:cancelled', { rideId });
          
          console.log(`❌ Ride ${rideId} cancelled by rider`);
        } catch (error) {
          console.error('Error cancelling ride:', error);
        }
      });
    }

    // ==================== ADMIN EVENTS ====================
    
    if (userType === 'admin') {
      socket.join('admin-room');
      
      // Send all online drivers
      socket.on('admin:get_all_drivers', async () => {
        const driversData = [];
        
        const driversList = Array.from(onlineDrivers.entries());
        for (const [userId, driver] of driversList) {
          try {
            const [userInfo] = await db!
              .select({
                name: users.name,
                phone: users.phone,
              })
              .from(users)
              .where(eq(users.id, userId));
            
            driversData.push({
              id: userId,
              name: userInfo?.name || 'Unknown',
              location: driver.location,
              status: driver.status,
              lastUpdate: driver.lastUpdate,
            });
          } catch (error) {
            console.error('Error fetching driver info:', error);
          }
        }
        
        socket.emit('admin:all_drivers', { drivers: driversData });
      });
      
      // Send all active rides
      socket.on('admin:get_active_rides', async () => {
        const ridesData = [];
        
        const ridesList = Array.from(activeRides.entries());
        for (const [rideId, ride] of ridesList) {
          try {
            const [rideInfo] = await getDb()
              .select()
              .from(rides)
              .where(eq(rides.id, rideId));
            
            if (rideInfo) {
              ridesData.push({
                ...rideInfo,
                ...ride, // Spread ride to get in-memory status updates
              });
            }
          } catch (error) {
            console.error('Error fetching ride info:', error);
          }
        }
        
        socket.emit('admin:active_rides', { rides: ridesData });
      });
      
      // Send platform metrics
      socket.emit('platform:metrics', platformMetrics);
    }

    // ==================== DISCONNECTION ====================
    
    socket.on('disconnect', () => {
      console.log(`❌ ${userType} disconnected: ${userId}`);
      
      if (userType === 'driver') {
        onlineDrivers.delete(userId);
        platformMetrics.activeDrivers = onlineDrivers.size;
        
        io.to('admin-room').emit('driver:status_changed', {
          driverId: userId,
          status: 'offline',
        });
      }
      
      // Clean up active rides
      activeRides.forEach((ride, rideId) => {
        if (ride.riderSocketId === socket.id) {
          ride.riderSocketId = undefined;
        }
        if (ride.driverSocketId === socket.id) {
          ride.driverSocketId = undefined;
        }
      });
    });
  });

  // Periodic cleanup of stale data
  setInterval(() => {
    const now = Date.now();
    const driversList = Array.from(onlineDrivers.entries());
    for (const [userId, driver] of driversList) {
      if (now - driver.lastUpdate > 60000) { // 1 minute
        onlineDrivers.delete(userId);
        console.log(`🧹 Cleaned up stale driver: ${userId}`);
      }
    }
    platformMetrics.activeDrivers = onlineDrivers.size;
  }, 30000); // Every 30 seconds

  return io;
}

/**
 * Find nearby drivers based on location and vehicle type
 */
async function findNearbyDrivers(
  lat: number,
  lng: number,
  vehicleType: string,
  radiusMeters: number = 5000
): Promise<Array<{ userId: string; distance: number }>> {
  const nearbyDrivers: Array<{ userId: string; distance: number }> = [];
  
  const driversList = Array.from(onlineDrivers.entries());
  for (const [userId, driver] of driversList) {
    if (driver.status !== 'online') continue;
    
    // Calculate distance using Haversine formula
    const distance = calculateDistance(
      lat,
      lng,
      driver.location.lat,
      driver.location.lng
    );
    
    if (distance <= radiusMeters) {
      nearbyDrivers.push({ userId, distance });
    }
  }
  
  // Sort by distance
  nearbyDrivers.sort((a, b) => a.distance - b.distance);
  
  return nearbyDrivers;
}

/**
 * Find next available driver when current driver rejects
 */
async function findNextAvailableDriver(rideId: string, rejectedDriverId?: string) {
  const pendingRequest = pendingRideRequests.get(rideId);
  if (!pendingRequest) return;
  
  const { rideRequest, requestedDrivers } = pendingRequest;
  
  if (rejectedDriverId) {
    requestedDrivers.add(rejectedDriverId);
  }
  
  const nearbyDrivers = await findNearbyDrivers(
    rideRequest.pickup.lat,
    rideRequest.pickup.lng,
    rideRequest.vehicleType,
    5000
  );
  
  // Find next driver not yet requested
  const nextDriver = nearbyDrivers.find(d => !requestedDrivers.has(d.userId));
  
  if (!nextDriver) {
    // No more drivers available
    const rideData = activeRides.get(rideId);
    if (rideData?.riderSocketId) {
      // Notify rider
      // Note: io is not accessible here, need to refactor or pass as parameter
      console.log(`❌ No more drivers available for ride ${rideId}`);
    }
    
    // Cancel ride
    try {
      await getDb().update(rides)
        .set({ status: 'cancelled', cancelledAt: new Date() })
        .where(eq(rides.id, rideId));
    } catch (error) {
      console.error('Error cancelling ride:', error);
    }
    
    clearTimeout(pendingRequest.timeout);
    pendingRideRequests.delete(rideId);
    activeRides.delete(rideId);
    return;
  }
  
  requestedDrivers.add(nextDriver.userId);
  
  // Send to next driver
  const driver = onlineDrivers.get(nextDriver.userId);
  if (driver) {
    // Need to get io instance - refactor needed
    console.log(`📤 Sending ride request to next driver: ${nextDriver.userId}`);
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
