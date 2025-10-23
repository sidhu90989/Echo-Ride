import { config } from "dotenv";
if (process.env.NODE_ENV !== 'production') {
  config();
}
// eslint-disable-next-line no-console
console.log(`[storage] module initialized. SIMPLE_AUTH=${process.env.SIMPLE_AUTH} DATABASE_URL=${process.env.DATABASE_URL ? 'SET' : 'MISSING'}`);

import {
  users,
  driverProfiles,
  rides as ridesTable,
  payments as paymentsTable,
  ratings as ratingsTable,
  ecoBadges as ecoBadgesTable,
  userBadges as userBadgesTable,
  referrals as referralsTable,
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
import { eq, and, or, desc, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";

// Note: don't read SIMPLE_AUTH at module import time because dotenv may not be loaded yet.
// We'll evaluate it at runtime inside getInstance().

async function getDb(): Promise<any> {
  const { db } = await import("./db");
  if (!db) {
    throw new Error("[db] Not initialized. Attempted to use database storage while SIMPLE_AUTH=true");
  }
  return db as any;
}

// Storage selector: use memory storage in SIMPLE_AUTH mode, database otherwise
class StorageSelector {
  private static instance: IStorage;

  static getInstance(): IStorage {
    if (!this.instance) {
      // Force in-memory storage strictly based on SIMPLE_AUTH flag
      const simple = process.env.SIMPLE_AUTH === 'true';
      // eslint-disable-next-line no-console
      console.log(`[storage] selecting storage. SIMPLE_AUTH=${process.env.SIMPLE_AUTH} -> ${simple ? 'memory' : 'database'}`);
      this.instance = simple ? new MemoryStorage() : new DatabaseStorage();
      // eslint-disable-next-line no-console
      console.log(`[storage] using ${simple ? 'memory' : 'database'} storage`);
    }
    return this.instance;
  }
}

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

  // Discovery
  listAvailableDrivers(): Promise<Array<{
    id: string;
    name: string;
    rating: any;
    vehicleNumber: string | null;
    vehicleType: 'e_rickshaw' | 'e_scooter' | 'cng_car';
    estimatedArrival: number;
    fare: number;
  }>>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const db = await getDb();
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const db = await getDb();
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Driver operations
  async getDriverProfile(userId: string): Promise<DriverProfile | undefined> {
    const db = await getDb();
    const [profile] = await db
      .select()
      .from(driverProfiles)
      .where(eq(driverProfiles.userId, userId));
    return profile || undefined;
  }

  async createDriverProfile(profile: InsertDriverProfile): Promise<DriverProfile> {
    const db = await getDb();
    const [driverProfile] = await db
      .insert(driverProfiles)
      .values(profile)
      .returning();
    return driverProfile;
  }

  async updateDriverProfile(userId: string, updates: Partial<DriverProfile>): Promise<DriverProfile> {
    const db = await getDb();
    const [profile] = await db
      .update(driverProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(driverProfiles.userId, userId))
      .returning();
    return profile;
  }

  // Ride operations
  async createRide(ride: InsertRide): Promise<Ride> {
    const db = await getDb();
    const [newRide] = await db.insert(ridesTable).values(ride).returning();
    return newRide;
  }

  async getRide(id: string): Promise<Ride | undefined> {
    const db = await getDb();
    const [ride] = await db.select().from(ridesTable).where(eq(ridesTable.id, id));
    return ride || undefined;
  }

  async getUserRides(userId: string, role: 'rider' | 'driver'): Promise<Ride[]> {
    const db = await getDb();
    const condition = role === 'rider' 
      ? eq(ridesTable.riderId, userId)
      : eq(ridesTable.driverId, userId);
    
    return await db
      .select()
      .from(ridesTable)
      .where(condition)
      .orderBy(desc(ridesTable.createdAt));
  }

  async getPendingRides(): Promise<Ride[]> {
    const db = await getDb();
    return await db
      .select()
      .from(ridesTable)
      .where(eq(ridesTable.status, 'pending'))
      .orderBy(ridesTable.requestedAt);
  }

  async getActiveRides(): Promise<Ride[]> {
    const db = await getDb();
    return await db
      .select()
      .from(ridesTable)
      .where(
        or(
          eq(ridesTable.status, 'accepted'),
          eq(ridesTable.status, 'in_progress')
        )
      )
      .orderBy(desc(ridesTable.requestedAt));
  }

  async updateRide(id: string, updates: Partial<Ride>): Promise<Ride> {
    const db = await getDb();
    const [ride] = await db
      .update(ridesTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ridesTable.id, id))
      .returning();
    return ride;
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const db = await getDb();
    const [newPayment] = await db.insert(paymentsTable).values(payment).returning();
    return newPayment;
  }

  async getPaymentByRide(rideId: string): Promise<Payment | undefined> {
    const db = await getDb();
    const [payment] = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.rideId, rideId));
    return payment || undefined;
  }

  // Rating operations
  async createRating(rating: InsertRating): Promise<Rating> {
    const db = await getDb();
    const [newRating] = await db.insert(ratingsTable).values(rating).returning();
    return newRating;
  }

  async getDriverRatings(driverId: string): Promise<Rating[]> {
    const db = await getDb();
    return await db
      .select()
      .from(ratingsTable)
      .where(eq(ratingsTable.rateeId, driverId))
      .orderBy(desc(ratingsTable.createdAt));
  }

  // Badge operations
  async getAllBadges(): Promise<EcoBadge[]> {
    const db = await getDb();
    return await db.select().from(ecoBadgesTable);
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const db = await getDb();
    return await db
      .select()
      .from(userBadgesTable)
      .where(eq(userBadgesTable.userId, userId));
  }

  async awardBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const db = await getDb();
    const [badge] = await db.insert(userBadgesTable).values(userBadge).returning();
    return badge;
  }

  // Referral operations
  async createReferral(referral: InsertReferral): Promise<Referral> {
    const db = await getDb();
    const [newReferral] = await db.insert(referralsTable).values(referral).returning();
    return newReferral;
  }

  async getUserReferrals(userId: string): Promise<Referral[]> {
    const db = await getDb();
    return await db
      .select()
      .from(referralsTable)
      .where(eq(referralsTable.referrerId, userId));
  }

  // Stats operations
  async getRiderStats(userId: string): Promise<any> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    const userRides = await db
      .select()
      .from(ridesTable)
      .where(and(
        eq(ridesTable.riderId, userId),
        eq(ridesTable.status, 'completed')
      ));
    
    const badgeCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(userBadgesTable)
      .where(eq(userBadgesTable.userId, userId));

    return {
      totalRides: userRides.length,
      ecoPoints: user?.ecoPoints || 0,
      totalCO2Saved: user?.totalCO2Saved || '0',
      badgesEarned: badgeCount[0]?.count || 0,
    };
  }

  async getDriverStats(userId: string): Promise<any> {
    const profile = await this.getDriverProfile(userId);
    
    const db = await getDb();
    const todayRides: Ride[] = await db
      .select()
      .from(ridesTable)
      .where(and(
        eq(ridesTable.driverId, userId),
        eq(ridesTable.status, 'completed'),
        sql`DATE(${ridesTable.completedAt}) = CURRENT_DATE`
      ));

    const todayEarnings = todayRides.reduce((sum: number, ride: Ride) => {
      return sum + Number(ride.actualFare || 0);
    }, 0);

    return {
      totalRides: profile?.totalRides || 0,
      totalEarnings: profile?.totalEarnings || '0',
      rating: profile?.rating || '5.00',
      todayEarnings: todayEarnings.toFixed(2),
    };
  }

  async getAdminStats(): Promise<any> {
    const db = await getDb();
    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const [driverCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(driverProfiles)
      .where(eq(driverProfiles.isAvailable, true));

    const allRides: Ride[] = await db.select().from(ridesTable);

    const completedRides = allRides.filter((r: Ride) => r.status === 'completed');
    const totalRevenue = completedRides.reduce((sum: number, ride: Ride) => {
      return sum + Number(ride.actualFare || 0);
    }, 0);

    const totalCO2 = completedRides.reduce((sum: number, ride: Ride) => {
      return sum + Number(ride.co2Saved || 0);
    }, 0);

    const todayRides = allRides.filter((r: Ride) => {
      return !!(r.requestedAt && new Date(r.requestedAt).toDateString() === new Date().toDateString());
    });

    const vehicleStats = {
      e_rickshaw: allRides.filter((r: Ride) => r.vehicleType === 'e_rickshaw').length,
      e_scooter: allRides.filter((r: Ride) => r.vehicleType === 'e_scooter').length,
      cng_car: allRides.filter((r: Ride) => r.vehicleType === 'cng_car').length,
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

  async listAvailableDrivers() {
    const db = await getDb();
    const rows = await db
      .select({
        id: driverProfiles.userId,
        name: users.name,
        rating: driverProfiles.rating,
        vehicleNumber: driverProfiles.vehicleNumber,
        vehicleType: driverProfiles.vehicleType,
      })
      .from(driverProfiles)
      .innerJoin(users, eq(driverProfiles.userId, users.id))
      .where(eq(driverProfiles.isAvailable, true));

    return rows.map((r: any) => ({
      ...r,
      estimatedArrival: 3,
      fare: r.vehicleType === 'e_scooter' ? 30 : r.vehicleType === 'e_rickshaw' ? 45 : 80,
    }));
  }
}

// In-memory storage for SIMPLE_AUTH/local runs
class MemoryStorage implements IStorage {
  private id = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);

  private _users: User[] = [];
  private _driverProfiles: DriverProfile[] = [];
  private _rides: Ride[] = [];
  private _payments: Payment[] = [];
  private _ratings: Rating[] = [];
  private _ecoBadges: EcoBadge[] = [
    { id: this.id(), name: 'Green Beginner', description: 'Complete your first eco-friendly ride', iconName: 'leaf', requiredPoints: 10, createdAt: new Date() },
    { id: this.id(), name: 'Eco Warrior', description: 'Save 10kg of CO₂', iconName: 'shield', requiredPoints: 100, createdAt: new Date() },
    { id: this.id(), name: 'Planet Protector', description: 'Complete 25 eco-rides', iconName: 'globe', requiredPoints: 250, createdAt: new Date() },
  ];
  private _userBadges: UserBadge[] = [];
  private _referrals: Referral[] = [];

  async getUser(id: string) { return this._users.find(u => u.id === id); }
  async getUserByEmail(email: string) { return this._users.find(u => u.email === email); }
  async getUserByFirebaseUid(firebaseUid: string) { return this._users.find(u => u.firebaseUid === firebaseUid); }
  async createUser(user: InsertUser): Promise<User> {
    const now = new Date();
    const u: User = {
      id: this.id(),
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name!,
      phone: user.phone,
      gender: user.gender,
      role: (user as any).role || 'rider',
      profilePhoto: null as any,
      ecoPoints: 0,
      totalCO2Saved: '0',
      referralCode: (user as any).referralCode,
      referredBy: (user as any).referredBy,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    } as any;
    this._users.push(u);
    return u;
  }
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const u = await this.getUser(id);
    if (!u) throw new Error('User not found');
    Object.assign(u, updates, { updatedAt: new Date() });
    return u;
  }

  async getDriverProfile(userId: string) { return this._driverProfiles.find(p => p.userId === userId); }
  async createDriverProfile(profile: InsertDriverProfile): Promise<DriverProfile> {
    const p: DriverProfile = {
      id: this.id(),
      userId: profile.userId,
      vehicleType: profile.vehicleType,
      vehicleNumber: profile.vehicleNumber,
      vehicleModel: (profile as any).vehicleModel ?? null as any,
      licenseNumber: profile.licenseNumber,
      kycStatus: (profile as any).kycStatus ?? 'pending',
      kycDocuments: [] as any,
      rating: (profile as any).rating ?? '5.00',
      totalRides: (profile as any).totalRides ?? 0,
      totalEarnings: (profile as any).totalEarnings ?? '0',
      isAvailable: (profile as any).isAvailable ?? false,
      femalePrefEnabled: (profile as any).femalePrefEnabled ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    this._driverProfiles.push(p);
    return p;
  }
  async updateDriverProfile(userId: string, updates: Partial<DriverProfile>): Promise<DriverProfile> {
    const p = await this.getDriverProfile(userId);
    if (!p) throw new Error('Driver profile not found');
    Object.assign(p, updates, { updatedAt: new Date() });
    return p;
  }

  async createRide(ride: InsertRide): Promise<Ride> {
    const r: Ride = {
      id: this.id(),
      ...ride as any,
      status: (ride as any).status ?? 'pending',
      requestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    this._rides.push(r);
    return r;
  }
  async getRide(id: string) { return this._rides.find(r => r.id === id); }
  async getUserRides(userId: string, role: 'rider' | 'driver') {
    const key = role === 'rider' ? 'riderId' : 'driverId';
    return this._rides.filter((r: any) => r[key] === userId).sort((a, b) => +b.createdAt! - +a.createdAt!);
  }
  async getPendingRides() { return this._rides.filter(r => r.status === 'pending').sort((a, b) => +a.requestedAt! - +b.requestedAt!); }
  async getActiveRides() { return this._rides.filter(r => r.status === 'accepted' || r.status === 'in_progress').sort((a, b) => +b.requestedAt! - +a.requestedAt!); }
  async updateRide(id: string, updates: Partial<Ride>): Promise<Ride> {
    const r = await this.getRide(id);
    if (!r) throw new Error('Ride not found');
    Object.assign(r, updates, { updatedAt: new Date() });
    return r;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const p: Payment = { id: this.id(), ...payment as any, paymentStatus: (payment as any).paymentStatus ?? 'pending', createdAt: new Date(), updatedAt: new Date() } as any;
    this._payments.push(p);
    return p;
  }
  async getPaymentByRide(rideId: string) { return this._payments.find(p => (p as any).rideId === rideId); }

  async createRating(rating: InsertRating): Promise<Rating> {
    const r: Rating = { id: this.id(), ...rating as any, createdAt: new Date() } as any;
    this._ratings.push(r);
    return r;
  }
  async getDriverRatings(driverId: string) { return this._ratings.filter(r => (r as any).rateeId === driverId).sort((a, b) => +b.createdAt! - +a.createdAt!); }

  async getAllBadges() { return this._ecoBadges; }
  async getUserBadges(userId: string) { return this._userBadges.filter(ub => (ub as any).userId === userId); }
  async awardBadge(userBadge: InsertUserBadge): Promise<UserBadge> {
    const ub: UserBadge = { id: this.id(), ...userBadge as any, earnedAt: new Date() } as any;
    this._userBadges.push(ub);
    return ub;
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const r: Referral = { id: this.id(), ...referral as any, createdAt: new Date() } as any;
    this._referrals.push(r);
    return r;
  }
  async getUserReferrals(userId: string) { return this._referrals.filter(r => (r as any).referrerId === userId); }

  async getRiderStats(userId: string) {
    const user = await this.getUser(userId);
    const completed = this._rides.filter(r => r.riderId === userId && r.status === 'completed');
    const badges = this._userBadges.filter(ub => (ub as any).userId === userId);
    return {
      totalRides: completed.length,
      ecoPoints: user?.ecoPoints ?? 0,
      totalCO2Saved: user?.totalCO2Saved ?? '0',
      badgesEarned: badges.length,
    };
  }
  async getDriverStats(userId: string) {
    const profile = await this.getDriverProfile(userId);
    const today = new Date().toDateString();
    const todayRides = this._rides.filter(r => r.driverId === userId && r.status === 'completed' && r.completedAt && new Date(r.completedAt).toDateString() === today);
    const todayEarnings = todayRides.reduce((sum, r) => sum + Number(r.actualFare || 0), 0);
    return {
      totalRides: profile?.totalRides ?? 0,
      totalEarnings: profile?.totalEarnings ?? '0',
      rating: profile?.rating ?? '5.00',
      todayEarnings: todayEarnings.toFixed(2),
    };
  }
  async getAdminStats() {
    const allRides = this._rides;
    const completed = allRides.filter(r => r.status === 'completed');
    const totalRevenue = completed.reduce((s, r) => s + Number(r.actualFare || 0), 0);
    const totalCO2 = completed.reduce((s, r) => s + Number(r.co2Saved || 0), 0);
    const todayRides = allRides.filter(r => r.requestedAt && new Date(r.requestedAt).toDateString() === new Date().toDateString());
    const vehicleStats = {
      e_rickshaw: allRides.filter(r => r.vehicleType === 'e_rickshaw').length,
      e_scooter: allRides.filter(r => r.vehicleType === 'e_scooter').length,
      cng_car: allRides.filter(r => r.vehicleType === 'cng_car').length,
    } as any;
    return {
      totalUsers: this._users.length,
      activeDrivers: this._driverProfiles.filter(d => d.isAvailable).length,
      totalRevenue: totalRevenue.toFixed(2),
      totalCO2Saved: totalCO2.toFixed(2),
      totalRides: allRides.length,
      todayRides: todayRides.length,
      weekRides: allRides.length,
      monthRides: allRides.length,
      vehicleStats,
    };
  }

  async listAvailableDrivers() {
    return this._driverProfiles
      .filter((d) => d.isAvailable)
      .map((d) => {
        const u = this._users.find((u) => u.id === d.userId);
        return {
          id: d.userId,
          name: u?.name || 'Unknown',
          rating: d.rating,
          vehicleNumber: d.vehicleNumber,
          vehicleType: d.vehicleType,
          estimatedArrival: 3,
          fare: d.vehicleType === 'e_scooter' ? 30 : d.vehicleType === 'e_rickshaw' ? 45 : 80,
        };
      });
  }
}

// Export storage instance using the selector
export const storage: IStorage = StorageSelector.getInstance();
