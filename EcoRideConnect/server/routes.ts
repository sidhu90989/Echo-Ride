import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import Stripe from "stripe";
import admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
});

// Helper to verify Firebase token
async function verifyFirebaseToken(req: any, res: any, next: any) {
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
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Helper to generate referral code
function generateReferralCode(name: string): string {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const namePart = name.substring(0, 3).toUpperCase();
  return `${namePart}${randomPart}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/verify", verifyFirebaseToken, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/complete-profile", verifyFirebaseToken, async (req: any, res) => {
    try {
      const { name, phone, role } = req.body;
      
      // Check if user already exists
      let user = await storage.getUserByFirebaseUid(req.firebaseUid);
      
      if (user) {
        return res.json(user);
      }

      // Create new user
      const referralCode = generateReferralCode(name);
      
      user = await storage.createUser({
        firebaseUid: req.firebaseUid,
        email: req.email,
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
      res.status(500).json({ error: error.message });
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

  // Ride routes
  app.post("/api/rides", verifyFirebaseToken, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
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

  app.post("/api/rides/:id/accept", verifyFirebaseToken, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const ride = await storage.updateRide(req.params.id, {
        driverId: user.id,
        status: 'accepted',
        acceptedAt: new Date(),
      });

      res.json(ride);
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

  app.get("/api/driver/pending-rides", verifyFirebaseToken, async (req: any, res) => {
    try {
      const rides = await storage.getPendingRides();
      res.json(rides);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/driver/availability", verifyFirebaseToken, async (req: any, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
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
