import { config } from "dotenv";
// Only load .env in non-production to avoid overriding deployed environment
if (process.env.NODE_ENV !== 'production') {
  config();
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import Stripe from "stripe";
import admin from "firebase-admin";
import nameApi from "./integrations/nameApi";
import { registerDriverSocket, unregisterSocket, setDriverOnline, getDriverSocket } from "./presence";
import { findNearestDrivers } from "./services/driverMatchingService";
import { initiateRideMatching } from "./services/rideMatchingService";
import { requestEmailOtp, verifyEmailOtp } from "./services/emailOtpService";
import { initializeSocketIO } from "./socketService";

// Flags
const SIMPLE_AUTH = process.env.SIMPLE_AUTH === "true";
console.log("🔧 Environment check:", {
  SIMPLE_AUTH,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "SET" : "NOT SET",
  NODE_ENV: process.env.NODE_ENV
});

// Initialize Firebase Admin always so we can verify ID tokens even in SIMPLE_AUTH mode
if (!admin.apps.length) {
  const PROJECT_ID =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    // Final fallback to current public project id to prevent runtime failures on cold starts
    "trusty-diorama-475905-c3";
  if (!process.env.GOOGLE_CLOUD_PROJECT && PROJECT_ID) {
    process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;
  }
  admin.initializeApp({
    projectId: PROJECT_ID,
  } as any);
}

// Initialize Stripe only if not SIMPLE_AUTH. Do not crash if key is missing;
// disable payments instead and let the route handle it gracefully.
let stripe: Stripe | null = null;
if (!SIMPLE_AUTH) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (key) {
    stripe = new Stripe(key);
  } else {
    // eslint-disable-next-line no-console
    console.warn('[payments] Stripe disabled: STRIPE_SECRET_KEY not set. Payment route will return 503 in production or mock in development.');
  }
}

// Helper to verify Firebase token
async function verifyFirebaseToken(req: any, res: any, next: any) {
  // Always allow a valid session user in development or when using simple auth.
  // This enables a hybrid mode: SIMPLE_AUTH can be false (DB mode) while
  // the client uses a simple session login for local testing.
  if (req.session?.user) {
    req.firebaseUid = req.session.user.firebaseUid;
    req.email = req.session.user.email;
    return next();
  }

  if (SIMPLE_AUTH) {
    // If we expected simple auth but no session is present, reject.
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.substring(7);
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.firebaseUid = decodedToken.uid;
    req.email = decodedToken.email;
    next();
  } catch (_error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Simple auth routes for local testing
function registerSimpleAuth(app: Express) {
  app.post('/api/auth/login', (req: any, res) => {
    const { email, name, role } = req.body || {};
    if (!email || !name || !role) {
      return res.status(400).json({ error: 'email, name, and role are required' });
    }
    // Stash user identity in session
    req.session.user = {
      firebaseUid: `local-${email}`,
      email,
      name,
      role,
    };
    res.json({ success: true });
  });

  app.post('/api/auth/logout', (req: any, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });
}

// Helper to generate referral code
function generateReferralCode(name: string): string {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const namePart = name.substring(0, 3).toUpperCase();
  return `${namePart}${randomPart}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable simple auth routes either when SIMPLE_AUTH=true or when explicitly
  // allowed via env for hybrid development with a real database.
  if (SIMPLE_AUTH || process.env.ALLOW_SIMPLE_AUTH_ROUTES === 'true') {
    // eslint-disable-next-line no-console
    console.log(`[auth] registering simple-auth routes (SIMPLE_AUTH=${SIMPLE_AUTH}, ALLOW_SIMPLE_AUTH_ROUTES=${process.env.ALLOW_SIMPLE_AUTH_ROUTES})`);
    registerSimpleAuth(app);
    // Email OTP routes for development/simple auth
    app.post('/api/auth/email-otp/request', (req: any, res) => {
      try {
        const { email } = req.body || {};
        const result = requestEmailOtp(email);
        res.json({ success: true, debugCode: result.debugCode });
      } catch (e: any) {
        res.status(400).json({ error: e?.message || 'Invalid email' });
      }
    });
    app.post('/api/auth/email-otp/verify', (req: any, res) => {
      try {
        const { email, otp, name, role } = req.body || {};
        if (!email || !otp) return res.status(400).json({ error: 'email and otp are required' });
        const ok = verifyEmailOtp(email, otp);
        if (!ok) return res.status(401).json({ error: 'Invalid or expired OTP' });
        const safeName = (name && String(name)) || (email.split('@')[0] + ' User');
        const safeRole = (role === 'driver' || role === 'admin') ? role : 'rider';
        req.session.user = {
          firebaseUid: `local-${String(email).toLowerCase()}`,
          email,
          name: safeName,
          role: safeRole,
        };
        res.json({ success: true });
      } catch (e: any) {
        res.status(500).json({ error: e?.message || 'Internal error' });
      }
    });
  }
  // Authentication routes
  // Support both GET and POST for verify for flexibility
  const verifyHandler = async (req: any, res: any) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
  app.get("/api/auth/verify", verifyFirebaseToken, verifyHandler);
  app.post("/api/auth/verify", verifyFirebaseToken, verifyHandler);

  app.post("/api/auth/complete-profile", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { name, phone, role } = req.body;
      if (!name || !role) {
        return res.status(400).json({ error: "Missing required fields: name, role" });
      }
      
      // Check if user already exists
      let user = await storage.getUserByFirebaseUid(req.firebaseUid);
      
      if (user) {
        return res.json(user);
      }

      // Create new user
      const referralCode = generateReferralCode(name);
      
      user = await storage.createUser({
        firebaseUid: req.firebaseUid,
        email: req.email || `${name.toLowerCase().split(' ').join('.')}@example.com`,
        name,
        phone,
        role,
        referralCode,
        ecoPoints: 0,
        totalCO2Saved: '0',
        isActive: true,
      });

      // If driver, create driver profile
      if (role === 'driver') {
        await storage.createDriverProfile({
          userId: user.id,
          vehicleType: 'e_rickshaw',
          vehicleNumber: 'PENDING',
          licenseNumber: 'PENDING',
          kycStatus: 'pending',
          rating: '5.00',
          totalRides: 0,
          totalEarnings: '0',
          isAvailable: false,
          femalePrefEnabled: false,
        });
      }

      res.json(user);
    } catch (error: any) {
      // Improved diagnostics in development
      // eslint-disable-next-line no-console
      console.error("/api/auth/complete-profile error:", error);
      const message = (() => {
        if (!error) return 'Unknown error';
        if (typeof error === 'string') return error;
        if (error.message) return error.message;
        try { return JSON.stringify(error); } catch { return String(error); }
      })();
      if (process.env.NODE_ENV !== 'production') {
        return res.status(500).json({ error: message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Native Firebase login: verify Firebase ID token, create/update user, and set session
  app.post('/api/auth/firebase-login', async (req: any, res) => {
    try {
      const { idToken, role, phone } = req.body || {};
      if (!idToken) return res.status(400).json({ error: 'idToken is required' });

      // Verify Firebase ID token
      const decoded = await admin.auth().verifyIdToken(idToken);
      const firebaseUid = decoded.uid;
      const email = decoded.email || undefined;
      const name = (decoded.name as string | undefined) || (email ? email.split('@')[0] + ' User' : 'EcoRide User');
      const phoneNumber = (decoded.phone_number as string | undefined) || (typeof phone === 'string' ? phone : undefined);
      const selectedRole = role === 'driver' || role === 'admin' ? role : 'rider';

      // Ensure user exists
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      // Fallback: if a user exists by email (from previous auth methods), link it
      if (!user && email) {
        const byEmail = await storage.getUserByEmail(email);
        if (byEmail) {
          user = await storage.updateUser(byEmail.id, { firebaseUid, phone: byEmail.phone || phoneNumber, role: byEmail.role || (selectedRole as any) });
        }
      }
      if (!user) {
        const referralCode = generateReferralCode(name);
        user = await storage.createUser({
          firebaseUid,
          email: email || `${firebaseUid}@example.com`,
          name,
          phone: phoneNumber,
          role: selectedRole as any,
          referralCode,
          ecoPoints: 0,
          totalCO2Saved: '0',
          isActive: true,
        } as any);

        if (selectedRole === 'driver') {
          await storage.createDriverProfile({
            userId: user.id,
            vehicleType: 'e_rickshaw',
            vehicleNumber: 'PENDING',
            licenseNumber: 'PENDING',
            kycStatus: 'pending',
            rating: '5.00',
            totalRides: 0,
            totalEarnings: '0',
            isAvailable: false,
            femalePrefEnabled: false,
          } as any);
        }
      } else if (phoneNumber && !user.phone) {
        // Update phone if provided and missing
        user = await storage.updateUser(user.id, { phone: phoneNumber });
      }

      // Establish session for hybrid flows
      req.session.user = {
        firebaseUid,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      res.json(user);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('[auth] /api/auth/firebase-login error:', e);
      const msg = e?.message || 'Invalid token';
      res.status(401).json({ error: msg });
    }
  });

  // Firebase client login: accept a Firebase ID token, verify with Admin SDK,
  // create or lookup the user in storage, establish a server session, and return user.
  app.post('/api/auth/firebase-login', async (req: any, res) => {
    try {
      const { idToken, role } = req.body || {};
      if (!idToken) return res.status(400).json({ error: 'idToken is required' });

      // Verify ID token with Firebase Admin
      const decoded = await admin.auth().verifyIdToken(idToken);
      const firebaseUid = decoded.uid;
      const email = decoded.email || undefined;
      const name = decoded.name || undefined;
      const phone = (decoded as any).phone_number || undefined;

      // Check if user exists in storage
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        // Create a new user record
        const referralCode = generateReferralCode(name || (email || 'user'));
        user = await storage.createUser({
          firebaseUid,
          email: email || `${firebaseUid}@unknown`,
          name: name || (email ? email.split('@')[0] : 'New User'),
          phone,
          role: (role === 'driver' || role === 'admin') ? role : 'rider',
          referralCode,
          ecoPoints: 0,
          totalCO2Saved: '0',
          isActive: true,
        } as any);

        if (user && user.role === 'driver') {
          await storage.createDriverProfile({
            userId: user.id,
            vehicleType: 'e_rickshaw',
            vehicleNumber: 'PENDING',
            licenseNumber: 'PENDING',
            kycStatus: 'pending',
            rating: '5.00',
            totalRides: 0,
            totalEarnings: '0',
            isAvailable: false,
            femalePrefEnabled: false,
          } as any);
        }
      } else {
        // Update basic fields in case they're missing or changed
        const updates: any = {};
        if (!user.email && email) updates.email = email;
        if (!user.name && name) updates.name = name;
        if (!user.phone && phone) updates.phone = phone;
        if (Object.keys(updates).length) {
          user = await storage.updateUser(user.id, updates);
        }
      }

      // Establish session for hybrid/simple dev usage
      req.session.user = {
        firebaseUid,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      return res.json(user);
    } catch (e: any) {
      return res.status(401).json({ error: e?.message || 'Invalid ID token' });
    }
  });

  // Note: OIDC verification route removed; native Firebase tokens are verified via /api/auth/verify using Firebase Admin.

  // Simple health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, mode: SIMPLE_AUTH ? 'simple' : 'full' });
  });

  // External Name API sanity endpoint (server-side only)
  app.get('/api/integrations/name-api/whoami', async (_req, res) => {
    try {
      const data = await nameApi.whoAmI();
      res.json({ ok: true, data });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
  });

  // Rider routes
  app.get("/api/rider/stats", verifyFirebaseToken, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const stats = await storage.getRiderStats(user.id);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/rider/available-drivers", verifyFirebaseToken, async (req: any, res: any) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (user.role !== "rider") {
        return res.status(403).json({ error: "Only riders can view available drivers" });
      }
      const drivers = await storage.listAvailableDrivers();
      res.json(drivers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rider/rides", verifyFirebaseToken, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const rides = await storage.getUserRides(user.id, 'rider');
      res.json(rides);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rider/badges", verifyFirebaseToken, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const allBadges = await storage.getAllBadges();
      const userBadges = await storage.getUserBadges(user.id);
      const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));
      
      const badgesWithStatus = allBadges.map(badge => ({
        ...badge,
        earned: earnedBadgeIds.has(badge.id),
      }));
      
      res.json(badgesWithStatus);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Ride routes - RIDERS ONLY can create rides
  app.post("/api/rides", verifyFirebaseToken, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Only riders can create ride requests
      if (user.role !== 'rider') {
        return res.status(403).json({ error: 'Only riders can request rides' });
      }

      const {
        pickupLocation,
        pickupLat,
        pickupLng,
        dropoffLocation,
        dropoffLat,
        dropoffLng,
        vehicleType,
        femalePrefRequested,
      } = req.body;

      const pickLabel = pickupLocation || `Pickup (${Number(pickupLat).toFixed(5)}, ${Number(pickupLng).toFixed(5)})`;
      const dropLabel = dropoffLocation || `Drop (${Number(dropoffLat).toFixed(5)}, ${Number(dropoffLng).toFixed(5)})`;

      // Calculate simple estimated fare and distance
      const distance = 5.5; // Mock distance in km
      const estimatedFare = vehicleType === 'e_scooter' ? 30 : vehicleType === 'e_rickshaw' ? 45 : 80;
      const co2Saved = distance * 0.12; // Mock CO2 calculation
      const ecoPoints = Math.floor(distance * 10);

      const ride = await storage.createRide({
        riderId: user.id,
        pickupLocation: pickLabel,
        pickupLat,
        pickupLng,
        dropoffLocation: dropLabel,
        dropoffLat,
        dropoffLng,
        vehicleType,
        femalePrefRequested,
        status: 'pending',
        distance: distance.toString(),
        estimatedFare: estimatedFare.toString(),
        co2Saved: co2Saved.toString(),
        ecoPointsEarned: ecoPoints,
      });

      // Kick off intelligent matching with 5km initial radius and 7km expansion
      initiateRideMatching(req.app, ride.id, Number(pickupLat), Number(pickupLng), Number(dropoffLat), Number(dropoffLng), vehicleType as any, estimatedFare);

      res.status(201).json({ id: ride.id, status: 'searching' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rides/:id", verifyFirebaseToken, async (req: any, res) => {
    try {
      const ride = await storage.getRide(req.params.id);
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }
      res.json(ride);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DRIVERS ONLY can accept rides
  app.post("/api/rides/:id/accept", verifyFirebaseToken, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Only drivers can accept rides
      if (user.role !== 'driver') {
        return res.status(403).json({ error: 'Only drivers can accept rides' });
      }

      const ride = await storage.getRide(req.params.id);
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      // Check if ride is still pending
      if (ride.status !== 'pending') {
        return res.status(400).json({ error: 'Ride is no longer available' });
      }

      // Check if driver is available
      const driverProfile = await storage.getDriverProfile(user.id);
      if (!driverProfile?.isAvailable) {
        return res.status(400).json({ error: 'Driver is not available' });
      }

      const updatedRide = await storage.updateRide(req.params.id, {
        driverId: user.id,
        status: 'accepted',
        acceptedAt: new Date(),
      });
      // Broadcast acceptance to all clients
      try {
        const wssLocal: any = (req.app as any).locals?.wss;
        if (wssLocal) {
          wssLocal.clients.forEach((client: any) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'ride_accepted',
                rideId: updatedRide.id,
                driverId: user.id,
                at: Date.now(),
              }));
            }
          });
        }
      } catch {}

      res.json(updatedRide);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/rides/:id/complete", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { actualFare } = req.body;
      const ride = await storage.getRide(req.params.id);
      
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      const updatedRide = await storage.updateRide(req.params.id, {
        status: 'completed',
        actualFare: actualFare || ride.estimatedFare,
        completedAt: new Date(),
      });

      // Update rider eco points and CO2
      const rider = await storage.getUser(ride.riderId);
      if (rider) {
        await storage.updateUser(ride.riderId, {
          ecoPoints: rider.ecoPoints + (ride.ecoPointsEarned || 0),
          totalCO2Saved: (Number(rider.totalCO2Saved) + Number(ride.co2Saved || 0)).toString(),
        });
      }

      // Update driver stats
      if (ride.driverId) {
        const driverProfile = await storage.getDriverProfile(ride.driverId);
        if (driverProfile) {
          await storage.updateDriverProfile(ride.driverId, {
            totalRides: driverProfile.totalRides + 1,
            totalEarnings: (Number(driverProfile.totalEarnings) + Number(actualFare || ride.estimatedFare)).toString(),
          });
        }
      }

      res.json(updatedRide);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Start ride (driver only)
  app.post("/api/rides/:id/start", verifyFirebaseToken, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const ride = await storage.getRide(req.params.id);
      if (!ride) return res.status(404).json({ error: 'Ride not found' });
      if (ride.driverId && ride.driverId !== user.id) {
        return res.status(403).json({ error: 'Not your ride' });
      }

      const updated = await storage.updateRide(req.params.id, {
        driverId: ride.driverId || user.id,
        status: 'in_progress',
        startedAt: new Date(),
      });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // SOS trigger (rider only - but keep simple)
  app.post("/api/rides/:id/sos", verifyFirebaseToken, async (req: any, res) => {
    try {
      const ride = await storage.getRide(req.params.id);
      if (!ride) return res.status(404).json({ error: 'Ride not found' });
      // Here we could notify admins/drivers via WebSocket, SMS, etc.
      // For now, just respond OK and mark a timestamp note if desired.
      await storage.updateRide(req.params.id, { } as any);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Driver routes
  app.get("/api/driver/stats", verifyFirebaseToken, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const stats = await storage.getDriverStats(user.id);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DRIVERS ONLY - get pending ride requests to accept
  app.get("/api/driver/pending-rides", verifyFirebaseToken, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Only drivers can see pending rides
      if (user.role !== 'driver') {
        return res.status(403).json({ error: 'Only drivers can view pending rides' });
      }

      // Check if driver is available
      const driverProfile = await storage.getDriverProfile(user.id);
      if (!driverProfile?.isAvailable) {
        return res.json([]); // No rides if driver is offline
      }

      const rides = await storage.getPendingRides();
      res.json(rides);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DRIVERS ONLY - toggle availability to receive ride requests
  app.put("/api/driver/availability", verifyFirebaseToken, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Only drivers can set availability
      if (user.role !== 'driver') {
        return res.status(403).json({ error: 'Only drivers can set availability' });
      }

      const { available, is_online, current_lat, current_lng } = req.body || {};
      const online = typeof is_online === 'boolean' ? is_online : !!available;
      const updated = await storage.updateDriverProfile(user.id, {
        isAvailable: online,
      });

      const lat = typeof current_lat === 'number' ? current_lat : undefined;
      const lng = typeof current_lng === 'number' ? current_lng : undefined;
      const vehicleType = updated.vehicleType as any;
      const rating = updated.rating ? Number(updated.rating) : undefined;
      const p = setDriverOnline(user.id, online, lat, lng, vehicleType, rating);

      try {
        const wssLocal: any = (req.app as any).locals?.wss;
        if (wssLocal) {
          const payload = JSON.stringify({
            type: online ? 'driver_online' : 'driver_offline',
            driverId: user.id,
            vehicleType,
            lat: p.lat,
            lng: p.lng,
            at: Date.now(),
          });
          wssLocal.clients.forEach((client: any) => {
            if (client.readyState === WebSocket.OPEN) client.send(payload);
          });
        }
      } catch {}

      res.json({ success: true, profile: updated, presence: p });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", verifyFirebaseToken, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/active-rides", verifyFirebaseToken, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      const rides = await storage.getActiveRides();
      res.json(rides);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe payment route
  app.post("/api/create-payment-intent", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { amount } = req.body;
      if (!stripe) {
        // If payments are disabled, return a helpful response
        if (process.env.NODE_ENV !== 'production') {
          // Mock response for local/dev
          return res.json({ clientSecret: `mock_${Math.round(amount * 100)}` });
        }
        return res.status(503).json({ error: 'Payments unavailable: Stripe is not configured' });
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "inr",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  // Initialize Socket.IO for real-time features (OLA-style maps)
  const io = initializeSocketIO(httpServer);
  console.log('🚀 Socket.IO initialized for real-time ride management');

  // WebSocket server for real-time updates (legacy - keeping for backward compatibility)
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  (app as any).locals.wss = wss;
  (app as any).locals.io = io; // Make Socket.IO accessible to routes

  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'location_update') {
          // Broadcast location to relevant clients
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'location_update',
                rideId: data.rideId,
                lat: data.lat,
                lng: data.lng,
                who: data.who || 'unknown',
                at: Date.now(),
              }));
            }
          });
        }
        if (data.type === 'iam_driver' && data.userId) {
          registerDriverSocket(data.userId, ws);
        }
        if (data.type === 'driver_online') {
          setDriverOnline(data.userId, true, data.lat, data.lng, data.vehicleType, data.rating);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      unregisterSocket(ws);
    });
  });

  return httpServer;
}
