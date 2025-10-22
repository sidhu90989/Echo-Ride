import { config } from "dotenv";
config(); // Load environment variables

import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import Stripe from "stripe";
import admin from "firebase-admin";
import { createRemoteJWKSet, jwtVerify } from "jose";
import nameApi from "./integrations/nameApi";

// Flags
const SIMPLE_AUTH = process.env.SIMPLE_AUTH === "true";
const STACK_PROJECT_ID = process.env.STACK_PROJECT_ID || process.env.VITE_STACK_PROJECT_ID;
const STACK_JWKS_URL = process.env.STACK_JWKS_URL || (STACK_PROJECT_ID
  ? `https://api.stack-auth.com/api/v1/projects/${STACK_PROJECT_ID}/.well-known/jwks.json`
  : undefined);
console.log("🔧 Environment check:", {
  SIMPLE_AUTH,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "SET" : "NOT SET",
  NODE_ENV: process.env.NODE_ENV
});

// Initialize Firebase Admin unless using SIMPLE_AUTH
if (!SIMPLE_AUTH) {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
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
  // First try Stack Auth (if configured). If that fails or not configured, try Firebase.
  if (STACK_JWKS_URL) {
    try {
      const JWKS = createRemoteJWKSet(new URL(STACK_JWKS_URL));
      const { payload } = await jwtVerify(token, JWKS);
      // Map Stack claims to our expected fields
      req.firebaseUid = (payload.sub as string) || (payload.user_id as string);
      req.email = (payload.email as string) || undefined;
      return next();
    } catch (e) {
      // fall through to Firebase verification
    }
  }

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

      // Calculate estimated fare and distance
      const distance = 5.5; // Mock distance in km
      const estimatedFare = vehicleType === 'e_scooter' ? 30 : vehicleType === 'e_rickshaw' ? 45 : 80;
      const co2Saved = distance * 0.12; // Mock CO2 calculation
      const ecoPoints = Math.floor(distance * 10);

      const ride = await storage.createRide({
        riderId: user.id,
        pickupLocation,
        pickupLat,
        pickupLng,
        dropoffLocation,
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
      // Broadcast a simple notification to all clients (e.g., drivers)
      try {
        const wssLocal: any = (req.app as any).locals?.wss;
        if (wssLocal) {
          wssLocal.clients.forEach((client: any) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'ride_booked',
                rideId: ride.id,
                pickupLat,
                pickupLng,
                dropoffLat,
                dropoffLng,
                vehicleType,
                at: Date.now(),
              }));
            }
          });
        }
      } catch {}

      res.json(ride);
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

      const { available } = req.body;
      await storage.updateDriverProfile(user.id, {
        isAvailable: available,
      });

      res.json({ success: true });
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

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  (app as any).locals.wss = wss;

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
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  return httpServer;
}
