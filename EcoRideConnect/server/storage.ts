import { 
  users, 
  driverProfiles,
  rides,
  payments,
  ratings,
  ecoBadges,
  userBadges,
  referrals,
  type User, 
  type InsertUser,
  type DriverProfile,
  type InsertDriverProfile,
  type Ride,
  type InsertRide,
  type Payment,
  type InsertPayment,
  type Rating,
  type InsertRating,
  type EcoBadge,
  type InsertEcoBadge,
  type UserBadge,
  type InsertUserBadge,
  type Referral,
  type InsertReferral,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Driver operations
  getDriverProfile(userId: string): Promise<DriverProfile | undefined>;
  createDriverProfile(profile: InsertDriverProfile): Promise<DriverProfile>;
  updateDriverProfile(userId: string, updates: Partial<DriverProfile>): Promise<DriverProfile>;
  
  // Ride operations
  createRide(ride: InsertRide): Promise<Ride>;
  getRide(id: string): Promise<Ride | undefined>;
  getUserRides(userId: string, role: 'rider' | 'driver'): Promise<Ride[]>;
  getPendingRides(): Promise<Ride[]>;
  getActiveRides(): Promise<Ride[]>;
  updateRide(id: string, updates: Partial<Ride>): Promise<Ride>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentByRide(rideId: string): Promise<Payment | undefined>;
  
  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  getDriverRatings(driverId: string): Promise<Rating[]>;
  
  // Badge operations
  getAllBadges(): Promise<EcoBadge[]>;
  getUserBadges(userId: string): Promise<UserBadge[]>;
  awardBadge(userBadge: InsertUserBadge): Promise<UserBadge>;
  
  // Referral operations
  createReferral(referral: InsertReferral): Promise<Referral>;
  getUserReferrals(userId: string): Promise<Referral[]>;
  
  // Stats operations
  getRiderStats(userId: string): Promise<any>;
  getDriverStats(userId: string): Promise<any>;
  getAdminStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Driver operations
  async getDriverProfile(userId: string): Promise<DriverProfile | undefined> {
    const [profile] = await db
      .select()
      .from(driverProfiles)
      .where(eq(driverProfiles.userId, userId));
    return profile || undefined;
  }

  async createDriverProfile(profile: InsertDriverProfile): Promise<DriverProfile> {
    const [driverProfile] = await db
      .insert(driverProfiles)
      .values(profile)
      .returning();
    return driverProfile;
  }

  async updateDriverProfile(userId: string, updates: Partial<DriverProfile>): Promise<DriverProfile> {
    const [profile] = await db
      .update(driverProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(driverProfiles.userId, userId))
      .returning();
    return profile;
  }

  // Ride operations
  async createRide(ride: InsertRide): Promise<Ride> {
    const [newRide] = await db.insert(rides).values(ride).returning();
    return newRide;
  }

  async getRide(id: string): Promise<Ride | undefined> {
    const [ride] = await db.select().from(rides).where(eq(rides.id, id));
    return ride || undefined;
  }

  async getUserRides(userId: string, role: 'rider' | 'driver'): Promise<Ride[]> {
    const condition = role === 'rider' 
      ? eq(rides.riderId, userId)
      : eq(rides.driverId, userId);
    
    return await db
      .select()
      .from(rides)
      .where(condition)
      .orderBy(desc(rides.createdAt));
  }

  async getPendingRides(): Promise<Ride[]> {
    return await db
      .select()
      .from(rides)
      .where(eq(rides.status, 'pending'))
      .orderBy(rides.requestedAt);
  }

  async getActiveRides(): Promise<Ride[]> {
    return await db
      .select()
      .from(rides)
      .where(
        or(
          eq(rides.status, 'accepted'),
          eq(rides.status, 'in_progress')
        )
      )
      .orderBy(desc(rides.requestedAt));
  }

  async updateRide(id: string, updates: Partial<Ride>): Promise<Ride> {
    const [ride] = await db
      .update(rides)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rides.id, id))
      .returning();
    return ride;
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getPaymentByRide(rideId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.rideId, rideId));
    return payment || undefined;
  }

  // Rating operations
  async createRating(rating: InsertRating): Promise<Rating> {
    const [newRating] = await db.insert(ratings).values(rating).returning();
    return newRating;
  }

  async getDriverRatings(driverId: string): Promise<Rating[]> {
    return await db
      .select()
      .from(ratings)
      .where(eq(ratings.rateeId, driverId))
      .orderBy(desc(ratings.createdAt));
  }

  // Badge operations
  async getAllBadges(): Promise<EcoBadge[]> {
    return await db.select().from(ecoBadges);
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));
  }

  async awardBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const [badge] = await db.insert(userBadges).values(userBadge).returning();
    return badge;
  }

  // Referral operations
  async createReferral(referral: InsertReferral): Promise<Referral> {
    const [newReferral] = await db.insert(referrals).values(referral).returning();
    return newReferral;
  }

  async getUserReferrals(userId: string): Promise<Referral[]> {
    return await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId));
  }

  // Stats operations
  async getRiderStats(userId: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    const userRides = await db
      .select()
      .from(rides)
      .where(and(
        eq(rides.riderId, userId),
        eq(rides.status, 'completed')
      ));
    
    const badgeCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(userBadges)
      .where(eq(userBadges.userId, userId));

    return {
      totalRides: userRides.length,
      ecoPoints: user?.ecoPoints || 0,
      totalCO2Saved: user?.totalCO2Saved || '0',
      badgesEarned: badgeCount[0]?.count || 0,
    };
  }

  async getDriverStats(userId: string): Promise<any> {
    const profile = await this.getDriverProfile(userId);
    
    const todayRides = await db
      .select()
      .from(rides)
      .where(and(
        eq(rides.driverId, userId),
        eq(rides.status, 'completed'),
        sql`DATE(${rides.completedAt}) = CURRENT_DATE`
      ));

    const todayEarnings = todayRides.reduce(
      (sum, ride) => sum + Number(ride.actualFare || 0), 
      0
    );

    return {
      totalRides: profile?.totalRides || 0,
      totalEarnings: profile?.totalEarnings || '0',
      rating: profile?.rating || '5.00',
      todayEarnings: todayEarnings.toFixed(2),
    };
  }

  async getAdminStats(): Promise<any> {
    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const [driverCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(driverProfiles)
      .where(eq(driverProfiles.isAvailable, true));

    const allRides = await db.select().from(rides);
    
    const completedRides = allRides.filter(r => r.status === 'completed');
    const totalRevenue = completedRides.reduce(
      (sum, ride) => sum + Number(ride.actualFare || 0), 
      0
    );
    
    const totalCO2 = completedRides.reduce(
      (sum, ride) => sum + Number(ride.co2Saved || 0), 
      0
    );

    const todayRides = allRides.filter(
      r => r.requestedAt && new Date(r.requestedAt).toDateString() === new Date().toDateString()
    );

    const vehicleStats = {
      e_rickshaw: allRides.filter(r => r.vehicleType === 'e_rickshaw').length,
      e_scooter: allRides.filter(r => r.vehicleType === 'e_scooter').length,
      cng_car: allRides.filter(r => r.vehicleType === 'cng_car').length,
    };

    return {
      totalUsers: userCount.count,
      activeDrivers: driverCount.count,
      totalRevenue: totalRevenue.toFixed(2),
      totalCO2Saved: totalCO2.toFixed(2),
      totalRides: allRides.length,
      todayRides: todayRides.length,
      weekRides: allRides.length,
      monthRides: allRides.length,
      vehicleStats,
    };
  }
}

export const storage = new DatabaseStorage();
