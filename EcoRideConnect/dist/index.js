var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  driverProfiles: () => driverProfiles,
  driverProfilesRelations: () => driverProfilesRelations,
  genderEnum: () => genderEnum,
  insertDriverProfileSchema: () => insertDriverProfileSchema,
  insertPaymentSchema: () => insertPaymentSchema,
  insertRatingSchema: () => insertRatingSchema,
  insertReferralSchema: () => insertReferralSchema,
  insertRideSchema: () => insertRideSchema,
  insertUserSchema: () => insertUserSchema,
  kycStatusEnum: () => kycStatusEnum,
  paymentMethodEnum: () => paymentMethodEnum,
  paymentStatusEnum: () => paymentStatusEnum,
  payments: () => payments,
  paymentsRelations: () => paymentsRelations,
  ratings: () => ratings,
  ratingsRelations: () => ratingsRelations,
  referrals: () => referrals,
  referralsRelations: () => referralsRelations,
  rideStatusEnum: () => rideStatusEnum,
  rides: () => rides,
  ridesRelations: () => ridesRelations,
  userRoleEnum: () => userRoleEnum,
  users: () => users,
  usersRelations: () => usersRelations,
  vehicleTypeEnum: () => vehicleTypeEnum
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var userRoleEnum, genderEnum, vehicleTypeEnum, rideStatusEnum, paymentMethodEnum, paymentStatusEnum, kycStatusEnum, users, driverProfiles, rides, payments, ratings, referrals, usersRelations, driverProfilesRelations, ridesRelations, paymentsRelations, ratingsRelations, referralsRelations, insertUserSchema, insertDriverProfileSchema, insertRideSchema, insertPaymentSchema, insertRatingSchema, insertReferralSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    userRoleEnum = pgEnum("user_role", ["rider", "driver", "admin"]);
    genderEnum = pgEnum("gender", ["male", "female", "other", "prefer_not_to_say"]);
    vehicleTypeEnum = pgEnum("vehicle_type", ["e_rickshaw", "e_scooter", "cng_car"]);
    rideStatusEnum = pgEnum("ride_status", ["pending", "accepted", "in_progress", "completed", "cancelled"]);
    paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "upi", "wallet"]);
    paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);
    kycStatusEnum = pgEnum("kyc_status", ["pending", "verified", "rejected"]);
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      firebaseUid: text("firebase_uid").unique(),
      email: text("email").unique(),
      name: text("name").notNull(),
      phone: text("phone").unique(),
      gender: genderEnum("gender"),
      role: userRoleEnum("role").notNull().default("rider"),
      profilePhoto: text("profile_photo"),
      referralCode: text("referral_code").unique(),
      referredBy: varchar("referred_by"),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    driverProfiles = pgTable("driver_profiles", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
      vehicleNumber: text("vehicle_number").notNull().unique(),
      vehicleModel: text("vehicle_model"),
      licenseNumber: text("license_number").notNull(),
      kycStatus: kycStatusEnum("kyc_status").notNull().default("pending"),
      kycDocuments: text("kyc_documents").array(),
      rating: decimal("rating", { precision: 3, scale: 2 }).default("5.00"),
      totalRides: integer("total_rides").notNull().default(0),
      totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).notNull().default("0"),
      isAvailable: boolean("is_available").notNull().default(false),
      femalePrefEnabled: boolean("female_pref_enabled").notNull().default(false),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    rides = pgTable("rides", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      riderId: varchar("rider_id").notNull().references(() => users.id),
      driverId: varchar("driver_id").references(() => users.id),
      pickupLocation: text("pickup_location").notNull(),
      pickupLat: decimal("pickup_lat", { precision: 10, scale: 7 }).notNull(),
      pickupLng: decimal("pickup_lng", { precision: 10, scale: 7 }).notNull(),
      dropoffLocation: text("dropoff_location").notNull(),
      dropoffLat: decimal("dropoff_lat", { precision: 10, scale: 7 }).notNull(),
      dropoffLng: decimal("dropoff_lng", { precision: 10, scale: 7 }).notNull(),
      vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
      femalePrefRequested: boolean("female_pref_requested").notNull().default(false),
      status: rideStatusEnum("status").notNull().default("pending"),
      distance: decimal("distance", { precision: 10, scale: 2 }),
      estimatedFare: decimal("estimated_fare", { precision: 10, scale: 2 }),
      actualFare: decimal("actual_fare", { precision: 10, scale: 2 }),
      requestedAt: timestamp("requested_at").notNull().defaultNow(),
      acceptedAt: timestamp("accepted_at"),
      startedAt: timestamp("started_at"),
      completedAt: timestamp("completed_at"),
      cancelledAt: timestamp("cancelled_at"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    payments = pgTable("payments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      rideId: varchar("ride_id").notNull().references(() => rides.id),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      paymentMethod: paymentMethodEnum("payment_method").notNull(),
      paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
      stripePaymentIntentId: text("stripe_payment_intent_id"),
      transactionId: text("transaction_id"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    ratings = pgTable("ratings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      rideId: varchar("ride_id").notNull().references(() => rides.id),
      raterId: varchar("rater_id").notNull().references(() => users.id),
      rateeId: varchar("ratee_id").notNull().references(() => users.id),
      rating: integer("rating").notNull(),
      feedback: text("feedback"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    referrals = pgTable("referrals", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      referrerId: varchar("referrer_id").notNull().references(() => users.id),
      refereeId: varchar("referee_id").notNull().references(() => users.id),
      bonusAwarded: boolean("bonus_awarded").notNull().default(false),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    usersRelations = relations(users, ({ one, many }) => ({
      driverProfile: one(driverProfiles, {
        fields: [users.id],
        references: [driverProfiles.userId]
      }),
      ridesAsRider: many(rides, { relationName: "riderRides" }),
      ridesAsDriver: many(rides, { relationName: "driverRides" }),
      ratingsGiven: many(ratings, { relationName: "raterRatings" }),
      ratingsReceived: many(ratings, { relationName: "rateeRatings" }),
      referralsMade: many(referrals, { relationName: "referrerReferrals" }),
      referralsReceived: many(referrals, { relationName: "refereeReferrals" })
    }));
    driverProfilesRelations = relations(driverProfiles, ({ one }) => ({
      user: one(users, {
        fields: [driverProfiles.userId],
        references: [users.id]
      })
    }));
    ridesRelations = relations(rides, ({ one, many }) => ({
      rider: one(users, {
        fields: [rides.riderId],
        references: [users.id],
        relationName: "riderRides"
      }),
      driver: one(users, {
        fields: [rides.driverId],
        references: [users.id],
        relationName: "driverRides"
      }),
      payment: one(payments),
      ratings: many(ratings)
    }));
    paymentsRelations = relations(payments, ({ one }) => ({
      ride: one(rides, {
        fields: [payments.rideId],
        references: [rides.id]
      })
    }));
    ratingsRelations = relations(ratings, ({ one }) => ({
      ride: one(rides, {
        fields: [ratings.rideId],
        references: [rides.id]
      }),
      rater: one(users, {
        fields: [ratings.raterId],
        references: [users.id],
        relationName: "raterRatings"
      }),
      ratee: one(users, {
        fields: [ratings.rateeId],
        references: [users.id],
        relationName: "rateeRatings"
      })
    }));
    referralsRelations = relations(referrals, ({ one }) => ({
      referrer: one(users, {
        fields: [referrals.referrerId],
        references: [users.id],
        relationName: "referrerReferrals"
      }),
      referee: one(users, {
        fields: [referrals.refereeId],
        references: [users.id],
        relationName: "refereeReferrals"
      })
    }));
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertDriverProfileSchema = createInsertSchema(driverProfiles).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertRideSchema = createInsertSchema(rides).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertPaymentSchema = createInsertSchema(payments).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertRatingSchema = createInsertSchema(ratings).omit({
      id: true,
      createdAt: true
    });
    insertReferralSchema = createInsertSchema(referrals).omit({
      id: true,
      createdAt: true
    });
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  pool: () => pool
});
import { config } from "dotenv";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var SIMPLE_AUTH, pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    if (process.env.NODE_ENV !== "production") {
      config();
    }
    SIMPLE_AUTH = process.env.SIMPLE_AUTH === "true";
    console.log(`[db] module init. SIMPLE_AUTH=${process.env.SIMPLE_AUTH} DATABASE_URL=${process.env.DATABASE_URL ? "SET" : "MISSING"}`);
    if (!SIMPLE_AUTH) {
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
      }
      neonConfig.webSocketConstructor = ws;
      pool = new Pool({ connectionString: process.env.DATABASE_URL });
      db = drizzle({ client: pool, schema: schema_exports });
    } else {
      console.log("[db] SIMPLE_AUTH=true -> skipping Neon/drizzle initialization");
    }
  }
});

// server/index.ts
import { config as config4 } from "dotenv";
import express2 from "express";
import cors from "cors";
import session from "express-session";
import MemoryStoreFactory from "memorystore";

// server/routes.ts
import { config as config3 } from "dotenv";
import { createServer } from "http";
import { WebSocketServer, WebSocket as WebSocket2 } from "ws";

// server/storage.ts
init_schema();
import { config as config2 } from "dotenv";
import { eq, and, or, desc, sql as sql2 } from "drizzle-orm";
import { customAlphabet } from "nanoid";
if (process.env.NODE_ENV !== "production") {
  config2();
}
console.log(`[storage] module initialized. SIMPLE_AUTH=${process.env.SIMPLE_AUTH} DATABASE_URL=${process.env.DATABASE_URL ? "SET" : "MISSING"}`);
async function getDb() {
  const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
  if (!db2) {
    throw new Error("[db] Not initialized. Attempted to use database storage while SIMPLE_AUTH=true");
  }
  return db2;
}
var StorageSelector = class {
  static instance;
  static getInstance() {
    if (!this.instance) {
      const simple = process.env.SIMPLE_AUTH === "true";
      console.log(`[storage] selecting storage. SIMPLE_AUTH=${process.env.SIMPLE_AUTH} -> ${simple ? "memory" : "database"}`);
      this.instance = simple ? new MemoryStorage() : new DatabaseStorage();
      console.log(`[storage] using ${simple ? "memory" : "database"} storage`);
    }
    return this.instance;
  }
};
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const db2 = await getDb();
    const [user] = await db2.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const db2 = await getDb();
    const [user] = await db2.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async getUserByFirebaseUid(firebaseUid) {
    const db2 = await getDb();
    const [user] = await db2.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || void 0;
  }
  async createUser(insertUser) {
    const db2 = await getDb();
    const [user] = await db2.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUser(id, updates) {
    const db2 = await getDb();
    const [user] = await db2.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user;
  }
  // Driver operations
  async getDriverProfile(userId) {
    const db2 = await getDb();
    const [profile] = await db2.select().from(driverProfiles).where(eq(driverProfiles.userId, userId));
    return profile || void 0;
  }
  async createDriverProfile(profile) {
    const db2 = await getDb();
    const [driverProfile] = await db2.insert(driverProfiles).values(profile).returning();
    return driverProfile;
  }
  async updateDriverProfile(userId, updates) {
    const db2 = await getDb();
    const [profile] = await db2.update(driverProfiles).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(driverProfiles.userId, userId)).returning();
    return profile;
  }
  // Ride operations
  async createRide(ride) {
    const db2 = await getDb();
    const [newRide] = await db2.insert(rides).values(ride).returning();
    return newRide;
  }
  async getRide(id) {
    const db2 = await getDb();
    const [ride] = await db2.select().from(rides).where(eq(rides.id, id));
    return ride || void 0;
  }
  async getUserRides(userId, role) {
    const db2 = await getDb();
    const condition = role === "rider" ? eq(rides.riderId, userId) : eq(rides.driverId, userId);
    return await db2.select().from(rides).where(condition).orderBy(desc(rides.createdAt));
  }
  async getPendingRides() {
    const db2 = await getDb();
    return await db2.select().from(rides).where(eq(rides.status, "pending")).orderBy(rides.requestedAt);
  }
  async getActiveRides() {
    const db2 = await getDb();
    return await db2.select().from(rides).where(
      or(
        eq(rides.status, "accepted"),
        eq(rides.status, "in_progress")
      )
    ).orderBy(desc(rides.requestedAt));
  }
  async updateRide(id, updates) {
    const db2 = await getDb();
    const [ride] = await db2.update(rides).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(rides.id, id)).returning();
    return ride;
  }
  // Payment operations
  async createPayment(payment) {
    const db2 = await getDb();
    const [newPayment] = await db2.insert(payments).values(payment).returning();
    return newPayment;
  }
  async getPaymentByRide(rideId) {
    const db2 = await getDb();
    const [payment] = await db2.select().from(payments).where(eq(payments.rideId, rideId));
    return payment || void 0;
  }
  // Rating operations
  async createRating(rating) {
    const db2 = await getDb();
    const [newRating] = await db2.insert(ratings).values(rating).returning();
    return newRating;
  }
  async getDriverRatings(driverId) {
    const db2 = await getDb();
    return await db2.select().from(ratings).where(eq(ratings.rateeId, driverId)).orderBy(desc(ratings.createdAt));
  }
  // Badge operations (removed - no longer tracking badges)
  // Referral operations
  async createReferral(referral) {
    const db2 = await getDb();
    const [newReferral] = await db2.insert(referrals).values(referral).returning();
    return newReferral;
  }
  async getUserReferrals(userId) {
    const db2 = await getDb();
    return await db2.select().from(referrals).where(eq(referrals.referrerId, userId));
  }
  // Stats operations
  async getRiderStats(userId) {
    const db2 = await getDb();
    const [user] = await db2.select().from(users).where(eq(users.id, userId));
    const userRides = await db2.select().from(rides).where(and(
      eq(rides.riderId, userId),
      eq(rides.status, "completed")
    ));
    return {
      totalRides: userRides.length,
      badgesEarned: 0
    };
  }
  async getDriverStats(userId) {
    const profile = await this.getDriverProfile(userId);
    const db2 = await getDb();
    const todayRides = await db2.select().from(rides).where(and(
      eq(rides.driverId, userId),
      eq(rides.status, "completed"),
      sql2`DATE(${rides.completedAt}) = CURRENT_DATE`
    ));
    const todayEarnings = todayRides.reduce((sum, ride) => {
      return sum + Number(ride.actualFare || 0);
    }, 0);
    return {
      totalRides: profile?.totalRides || 0,
      totalEarnings: profile?.totalEarnings || "0",
      rating: profile?.rating || "5.00",
      todayEarnings: todayEarnings.toFixed(2)
    };
  }
  async getAdminStats() {
    const db2 = await getDb();
    const [userCount] = await db2.select({ count: sql2`count(*)` }).from(users);
    const [driverCount] = await db2.select({ count: sql2`count(*)` }).from(driverProfiles).where(eq(driverProfiles.isAvailable, true));
    const allRides = await db2.select().from(rides);
    const completedRides = allRides.filter((r) => r.status === "completed");
    const totalRevenue = completedRides.reduce((sum, ride) => {
      return sum + Number(ride.actualFare || 0);
    }, 0);
    const todayRides = allRides.filter((r) => {
      return !!(r.requestedAt && new Date(r.requestedAt).toDateString() === (/* @__PURE__ */ new Date()).toDateString());
    });
    const vehicleStats = {
      e_rickshaw: allRides.filter((r) => r.vehicleType === "e_rickshaw").length,
      e_scooter: allRides.filter((r) => r.vehicleType === "e_scooter").length,
      cng_car: allRides.filter((r) => r.vehicleType === "cng_car").length
    };
    return {
      totalUsers: userCount.count,
      activeDrivers: driverCount.count,
      totalRevenue: totalRevenue.toFixed(2),
      totalRides: allRides.length,
      todayRides: todayRides.length,
      weekRides: allRides.length,
      monthRides: allRides.length,
      vehicleStats
    };
  }
  async listAvailableDrivers() {
    const db2 = await getDb();
    const rows = await db2.select({
      id: driverProfiles.userId,
      name: users.name,
      rating: driverProfiles.rating,
      vehicleNumber: driverProfiles.vehicleNumber,
      vehicleType: driverProfiles.vehicleType
    }).from(driverProfiles).innerJoin(users, eq(driverProfiles.userId, users.id)).where(eq(driverProfiles.isAvailable, true));
    return rows.map((r) => ({
      ...r,
      estimatedArrival: 3,
      fare: r.vehicleType === "e_scooter" ? 30 : r.vehicleType === "e_rickshaw" ? 45 : 80
    }));
  }
};
var MemoryStorage = class {
  id = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);
  _users = [];
  _driverProfiles = [];
  _rides = [];
  _payments = [];
  _ratings = [];
  _referrals = [];
  async getUser(id) {
    return this._users.find((u) => u.id === id);
  }
  async getUserByEmail(email) {
    return this._users.find((u) => u.email === email);
  }
  async getUserByFirebaseUid(firebaseUid) {
    return this._users.find((u) => u.firebaseUid === firebaseUid);
  }
  async createUser(user) {
    const now = /* @__PURE__ */ new Date();
    const u = {
      id: this.id(),
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      phone: user.phone,
      gender: user.gender,
      role: user.role || "rider",
      profilePhoto: null,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    this._users.push(u);
    return u;
  }
  async updateUser(id, updates) {
    const u = await this.getUser(id);
    if (!u) throw new Error("User not found");
    Object.assign(u, updates, { updatedAt: /* @__PURE__ */ new Date() });
    return u;
  }
  async getDriverProfile(userId) {
    return this._driverProfiles.find((p) => p.userId === userId);
  }
  async createDriverProfile(profile) {
    const p = {
      id: this.id(),
      userId: profile.userId,
      vehicleType: profile.vehicleType,
      vehicleNumber: profile.vehicleNumber,
      vehicleModel: profile.vehicleModel ?? null,
      licenseNumber: profile.licenseNumber,
      kycStatus: profile.kycStatus ?? "pending",
      kycDocuments: [],
      rating: profile.rating ?? "5.00",
      totalRides: profile.totalRides ?? 0,
      totalEarnings: profile.totalEarnings ?? "0",
      isAvailable: profile.isAvailable ?? false,
      femalePrefEnabled: profile.femalePrefEnabled ?? false,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this._driverProfiles.push(p);
    return p;
  }
  async updateDriverProfile(userId, updates) {
    const p = await this.getDriverProfile(userId);
    if (!p) throw new Error("Driver profile not found");
    Object.assign(p, updates, { updatedAt: /* @__PURE__ */ new Date() });
    return p;
  }
  async createRide(ride) {
    const r = {
      id: this.id(),
      ...ride,
      status: ride.status ?? "pending",
      requestedAt: /* @__PURE__ */ new Date(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this._rides.push(r);
    return r;
  }
  async getRide(id) {
    return this._rides.find((r) => r.id === id);
  }
  async getUserRides(userId, role) {
    const key = role === "rider" ? "riderId" : "driverId";
    return this._rides.filter((r) => r[key] === userId).sort((a, b) => +b.createdAt - +a.createdAt);
  }
  async getPendingRides() {
    return this._rides.filter((r) => r.status === "pending").sort((a, b) => +a.requestedAt - +b.requestedAt);
  }
  async getActiveRides() {
    return this._rides.filter((r) => r.status === "accepted" || r.status === "in_progress").sort((a, b) => +b.requestedAt - +a.requestedAt);
  }
  async updateRide(id, updates) {
    const r = await this.getRide(id);
    if (!r) throw new Error("Ride not found");
    Object.assign(r, updates, { updatedAt: /* @__PURE__ */ new Date() });
    return r;
  }
  async createPayment(payment) {
    const p = { id: this.id(), ...payment, paymentStatus: payment.paymentStatus ?? "pending", createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() };
    this._payments.push(p);
    return p;
  }
  async getPaymentByRide(rideId) {
    return this._payments.find((p) => p.rideId === rideId);
  }
  async createRating(rating) {
    const r = { id: this.id(), ...rating, createdAt: /* @__PURE__ */ new Date() };
    this._ratings.push(r);
    return r;
  }
  async getDriverRatings(driverId) {
    return this._ratings.filter((r) => r.rateeId === driverId).sort((a, b) => +b.createdAt - +a.createdAt);
  }
  async createReferral(referral) {
    const r = { id: this.id(), ...referral, createdAt: /* @__PURE__ */ new Date() };
    this._referrals.push(r);
    return r;
  }
  async getUserReferrals(userId) {
    return this._referrals.filter((r) => r.referrerId === userId);
  }
  async getRiderStats(userId) {
    const user = await this.getUser(userId);
    const completed = this._rides.filter((r) => r.riderId === userId && r.status === "completed");
    return {
      totalRides: completed.length,
      badgesEarned: 0
    };
  }
  async getDriverStats(userId) {
    const profile = await this.getDriverProfile(userId);
    const today = (/* @__PURE__ */ new Date()).toDateString();
    const todayRides = this._rides.filter((r) => r.driverId === userId && r.status === "completed" && r.completedAt && new Date(r.completedAt).toDateString() === today);
    const todayEarnings = todayRides.reduce((sum, r) => sum + Number(r.actualFare || 0), 0);
    return {
      totalRides: profile?.totalRides ?? 0,
      totalEarnings: profile?.totalEarnings ?? "0",
      rating: profile?.rating ?? "5.00",
      todayEarnings: todayEarnings.toFixed(2)
    };
  }
  async getAdminStats() {
    const allRides = this._rides;
    const completed = allRides.filter((r) => r.status === "completed");
    const totalRevenue = completed.reduce((s, r) => s + Number(r.actualFare || 0), 0);
    const todayRides = allRides.filter((r) => r.requestedAt && new Date(r.requestedAt).toDateString() === (/* @__PURE__ */ new Date()).toDateString());
    const vehicleStats = {
      e_rickshaw: allRides.filter((r) => r.vehicleType === "e_rickshaw").length,
      e_scooter: allRides.filter((r) => r.vehicleType === "e_scooter").length,
      cng_car: allRides.filter((r) => r.vehicleType === "cng_car").length
    };
    return {
      totalUsers: this._users.length,
      activeDrivers: this._driverProfiles.filter((d) => d.isAvailable).length,
      totalRevenue: totalRevenue.toFixed(2),
      totalRides: allRides.length,
      todayRides: todayRides.length,
      weekRides: allRides.length,
      monthRides: allRides.length,
      vehicleStats
    };
  }
  async listAvailableDrivers() {
    return this._driverProfiles.filter((d) => d.isAvailable).map((d) => {
      const u = this._users.find((u2) => u2.id === d.userId);
      return {
        id: d.userId,
        name: u?.name || "Unknown",
        rating: d.rating,
        vehicleNumber: d.vehicleNumber,
        vehicleType: d.vehicleType,
        estimatedArrival: 3,
        fare: d.vehicleType === "e_scooter" ? 30 : d.vehicleType === "e_rickshaw" ? 45 : 80
      };
    });
  }
};
var storage = StorageSelector.getInstance();

// server/routes.ts
import Stripe from "stripe";
import admin from "firebase-admin";

// server/integrations/nameApi.ts
function getEnv() {
  const isProd = process.env.NODE_ENV === "production";
  const baseUrl = isProd ? process.env.NAME_API_BASE_URL_PROD : process.env.NAME_API_BASE_URL_DEV;
  const token = isProd ? process.env.NAME_API_TOKEN_PROD : process.env.NAME_API_TOKEN_DEV;
  if (!baseUrl || !token) {
    throw new Error("[nameApi] Missing NAME_API_* envs. Please configure .env");
  }
  return { baseUrl, token };
}
async function fetchJson(path3, init) {
  const { baseUrl, token } = getEnv();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1e4);
  try {
    const res = await fetch(`${baseUrl}${path3}`, {
      ...init,
      method: init?.method || "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...init?.headers || {}
      },
      signal: controller.signal
    });
    if (!res.ok) {
      const text2 = await res.text().catch(() => "");
      throw new Error(`[nameApi] ${res.status} ${res.statusText} :: ${text2}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}
var nameApi = {
  ping: () => fetchJson(`/ping`),
  whoAmI: () => fetchJson(`/whoami`)
};
var nameApi_default = nameApi;

// server/presence.ts
var drivers = /* @__PURE__ */ new Map();
var socketToUser = /* @__PURE__ */ new WeakMap();
function registerDriverSocket(userId, ws2) {
  const prev = drivers.get(userId) || { userId, isOnline: false, updatedAt: Date.now() };
  prev.socket = ws2;
  drivers.set(userId, prev);
  socketToUser.set(ws2, userId);
}
function unregisterSocket(ws2) {
  const uid = socketToUser.get(ws2);
  if (!uid) return;
  const p = drivers.get(uid);
  if (p && p.socket === ws2) {
    p.socket = void 0;
    p.isOnline = false;
    p.updatedAt = Date.now();
    drivers.set(uid, p);
  }
}
function setDriverOnline(userId, online, lat, lng, vehicleType, rating) {
  const cur = drivers.get(userId) || { userId, isOnline: false, updatedAt: Date.now() };
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
function getOnlineDriversByVehicle(type) {
  return Array.from(drivers.values()).filter((d) => d.isOnline && !!d.lat && !!d.lng && d.vehicleType === type);
}
function getDriverSocket(userId) {
  return drivers.get(userId)?.socket;
}

// server/services/rideMatchingService.ts
import { WebSocket } from "ws";

// server/utils/location.ts
function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => d * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// server/services/rideMatchingService.ts
function comfortForVehicle(v) {
  switch (v) {
    case "cng_car":
      return 1;
    case "e_rickshaw":
      return 0.8;
    case "e_scooter":
      return 0.6;
    default:
      return 0.7;
  }
}
function scoreDriver({ distanceKm, radiusKm, rating, completionRate, comfort }) {
  const distanceScore = Math.max(0, 1 - distanceKm / Math.max(radiusKm, 1e-3));
  const ratingScore = Math.min(1, Math.max(0, rating / 5));
  const completionScore = Math.min(1, Math.max(0, completionRate));
  const comfortScore = Math.min(1, Math.max(0, comfort));
  return 0.6 * distanceScore + 0.2 * ratingScore + 0.1 * completionScore + 0.1 * comfortScore;
}
async function findTopDrivers(pickupLat, pickupLng, vehicleType, radiusKm) {
  const online = getOnlineDriversByVehicle(vehicleType);
  if (!online.length) return [];
  const avail = await storage.listAvailableDrivers();
  const byId = new Map(avail.map((d) => [d.id, d]));
  const profilesArr = await Promise.all(
    online.map((p) => storage.getDriverProfile(p.userId).catch(() => null))
  );
  const profiles = new Map(online.map((p, i) => [p.userId, profilesArr[i]]));
  const candidates = online.map((p) => {
    const db2 = byId.get(p.userId);
    const prof = profiles.get(p.userId) || null;
    const ratingNum = db2?.rating ? Number(db2.rating) : prof?.rating ? Number(prof.rating) : p.rating ?? 4.5;
    const totalRides = prof?.totalRides ?? 0;
    const completionRate = totalRides > 0 ? Math.min(0.99, 0.8 + Math.min(0.19, totalRides / 1e3)) : 0.85;
    const distanceKm = haversineDistanceKm(pickupLat, pickupLng, p.lat, p.lng);
    if (distanceKm > radiusKm) return null;
    const comfort = comfortForVehicle(db2?.vehicleType || prof?.vehicleType || p.vehicleType);
    const score = scoreDriver({ distanceKm, radiusKm, rating: ratingNum, completionRate, comfort });
    return {
      id: p.userId,
      name: db2?.name || "Driver",
      rating: isNaN(ratingNum) ? 4.5 : ratingNum,
      totalRides,
      completionRate,
      vehicleType: db2?.vehicleType || prof?.vehicleType || p.vehicleType,
      lat: p.lat,
      lng: p.lng,
      distanceKm,
      score
    };
  }).filter(Boolean);
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 10);
}
async function notifyDrivers(ride, drivers2, maxNotify = 3) {
  const toNotify = drivers2.slice(0, maxNotify);
  for (const d of toNotify) {
    const sock = getDriverSocket(d.id);
    if (sock && sock.readyState === WebSocket.OPEN) {
      sock.send(
        JSON.stringify({
          type: "ride_request",
          rideId: ride.id,
          pickupLat: ride.pickupLat,
          pickupLng: ride.pickupLng,
          dropoffLat: ride.dropoffLat,
          dropoffLng: ride.dropoffLng,
          vehicleType: ride.vehicleType,
          estimatedFare: ride.estimatedFare,
          distanceKm: d.distanceKm,
          at: Date.now()
        })
      );
    }
  }
  return toNotify.map((d) => d.id);
}
async function initiateRideMatching(app2, rideId, pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType, estimatedFare) {
  const wss = app2?.locals?.wss;
  const broadcast = (payload) => {
    if (!wss) return;
    const data = JSON.stringify(payload);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(data);
    });
  };
  async function isRidePending() {
    const latest = await storage.getRide(rideId);
    return latest && latest.status === "pending";
  }
  broadcast({ type: "matching_update", rideId, phase: "initial", radiusKm: 5, at: Date.now() });
  const topDrivers5 = await findTopDrivers(pickupLat, pickupLng, vehicleType, 5);
  const notified = new Set(await notifyDrivers({ id: rideId, pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType, estimatedFare }, topDrivers5, 3));
  setTimeout(async () => {
    if (!await isRidePending()) return;
    broadcast({ type: "matching_update", rideId, phase: "expanded", radiusKm: 7, at: Date.now() });
    const topDrivers7 = await findTopDrivers(pickupLat, pickupLng, vehicleType, 7);
    const more = topDrivers7.filter((d) => !notified.has(d.id));
    await notifyDrivers({ id: rideId, pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType, estimatedFare }, more, 3);
    setTimeout(async () => {
      if (!await isRidePending()) return;
      broadcast({ type: "ride_timeout", rideId, at: Date.now() });
    }, 3e4);
  }, 3e4);
}

// server/services/emailOtpService.ts
var store = /* @__PURE__ */ new Map();
function generateCode() {
  return Math.floor(1e5 + Math.random() * 9e5).toString();
}
function requestEmailOtp(emailRaw, ttlMs = 5 * 60 * 1e3) {
  const email = (emailRaw || "").trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error("Invalid email");
  }
  const code = generateCode();
  const expiresAt = Date.now() + ttlMs;
  store.set(email, { code, expiresAt, attempts: 0 });
  console.log(`[email-otp] OTP for ${email}: ${code} (expires in ${Math.round(ttlMs / 1e3)}s)`);
  return { success: true, debugCode: process.env.NODE_ENV !== "production" ? code : void 0 };
}
function verifyEmailOtp(emailRaw, code) {
  const email = (emailRaw || "").trim().toLowerCase();
  const rec = store.get(email);
  if (!rec) return false;
  rec.attempts += 1;
  if (rec.attempts > 5) {
    store.delete(email);
    return false;
  }
  if (Date.now() > rec.expiresAt) {
    store.delete(email);
    return false;
  }
  if (rec.code !== String(code).trim()) return false;
  store.delete(email);
  return true;
}

// server/socketService.ts
init_db();
init_schema();
import { Server as SocketIOServer } from "socket.io";
import { eq as eq2, sql as sql3 } from "drizzle-orm";
function getDb2() {
  if (!db) {
    throw new Error("Database connection not initialized");
  }
  return db;
}
var onlineDrivers = /* @__PURE__ */ new Map();
var driverTraces = /* @__PURE__ */ new Map();
var TRACE_LIMIT = 500;
var activeRides = /* @__PURE__ */ new Map();
var pendingRideRequests = /* @__PURE__ */ new Map();
var platformMetrics = {
  totalDrivers: 0,
  activeDrivers: 0,
  activeRides: 0,
  todayRevenue: 0,
  todayRides: 0,
  avgResponseTime: 0
};
function initializeSocketIO(httpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN?.split(",").map((s) => s.trim()) || "*",
      credentials: true
    },
    transports: ["websocket", "polling"]
  });
  console.log("\u{1F50C} Socket.IO server initialized");
  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    const userType = socket.handshake.auth.userType;
    if (!userId || !userType) {
      return next(new Error("Authentication required"));
    }
    socket.data.userId = userId;
    socket.data.userType = userType;
    next();
  });
  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    const userType = socket.data.userType;
    console.log(`\u2705 ${userType} connected: ${userId}`);
    if (userType === "driver") {
      socket.on("driver_status_update", async (data) => {
        try {
          if (data?.isAvailable) {
            const initialLoc = data.location || onlineDrivers.get(userId)?.location || { lat: 0, lng: 0 };
            onlineDrivers.set(userId, {
              socketId: socket.id,
              userId,
              location: initialLoc,
              status: "online",
              lastUpdate: Date.now()
            });
            platformMetrics.activeDrivers = onlineDrivers.size;
            io.to("admin-room").emit("driver:status_changed", { driverId: userId, status: "online", location: initialLoc });
          } else {
            onlineDrivers.delete(userId);
            platformMetrics.activeDrivers = onlineDrivers.size;
            io.to("admin-room").emit("driver:status_changed", { driverId: userId, status: "offline" });
          }
        } catch (err) {
          console.warn("driver_status_update handling failed:", err);
        }
      });
      socket.on("driver_location_update", (data) => {
        const driver = onlineDrivers.get(userId);
        if (driver) {
          driver.location = data.location;
          driver.lastUpdate = Date.now();
          const arr = driverTraces.get(userId) || [];
          arr.push({ lat: data.location.lat, lng: data.location.lng, timestamp: Date.now() });
          if (arr.length > TRACE_LIMIT) arr.splice(0, arr.length - TRACE_LIMIT);
          driverTraces.set(userId, arr);
          io.to("admin-room").emit("driver:location_update", { driverId: userId, location: data.location });
        }
      });
      socket.on("driver:online", async (data) => {
        onlineDrivers.set(userId, {
          socketId: socket.id,
          userId,
          location: data.location,
          status: "online",
          lastUpdate: Date.now()
        });
        try {
          await getDb2().update(driverProfiles).set({ isAvailable: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(driverProfiles.userId, userId));
        } catch (error) {
          console.error("Error updating driver status:", error);
        }
        platformMetrics.activeDrivers = onlineDrivers.size;
        io.to("admin-room").emit("driver:status_changed", {
          driverId: userId,
          status: "online",
          location: data.location
        });
        console.log(`\u{1F7E2} Driver ${userId} is now online`);
      });
      socket.on("driver:offline", async () => {
        onlineDrivers.delete(userId);
        try {
          await getDb2().update(driverProfiles).set({ isAvailable: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(driverProfiles.userId, userId));
        } catch (error) {
          console.error("Error updating driver status:", error);
        }
        platformMetrics.activeDrivers = onlineDrivers.size;
        io.to("admin-room").emit("driver:status_changed", {
          driverId: userId,
          status: "offline"
        });
        console.log(`\u26AA Driver ${userId} is now offline`);
      });
      socket.on("driver:location_update", (data) => {
        const driver = onlineDrivers.get(userId);
        if (driver) {
          driver.location = data.location;
          driver.lastUpdate = Date.now();
          const arr = driverTraces.get(userId) || [];
          arr.push({ lat: data.location.lat, lng: data.location.lng, timestamp: Date.now() });
          if (arr.length > TRACE_LIMIT) arr.splice(0, arr.length - TRACE_LIMIT);
          driverTraces.set(userId, arr);
          activeRides.forEach((ride, rideId) => {
            if (ride.driverId === userId && ride.riderSocketId) {
              io.to(ride.riderSocketId).emit("ride:driver_location", {
                location: data.location
              });
            }
          });
          io.to("admin-room").emit("driver:location_update", {
            driverId: userId,
            location: data.location
          });
        }
      });
      socket.on("request_all_drivers", () => {
        const snapshot = Array.from(onlineDrivers.values()).map((d) => ({
          id: d.userId,
          name: "",
          phone: "",
          vehicleType: "",
          vehicleNumber: "",
          rating: 0,
          location: d.location,
          status: d.status
        }));
        socket.emit("all_drivers_locations", snapshot);
      });
      socket.on("request_driver_trace", (data) => {
        const items = driverTraces.get(data.driverId) || [];
        socket.emit("driver_trace", { driverId: data.driverId, points: items });
      });
      socket.on("ride:accept", async (data) => {
        const { rideId } = data;
        if (!db) {
          socket.emit("error", { message: "Database not available" });
          return;
        }
        try {
          await getDb2().update(rides).set({
            driverId: userId,
            status: "accepted",
            acceptedAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq2(rides.id, rideId));
          const [driverInfo] = await db.select({
            name: users.name,
            phone: users.phone,
            vehicleType: driverProfiles.vehicleType,
            vehicleNumber: driverProfiles.vehicleNumber,
            rating: driverProfiles.rating
          }).from(users).innerJoin(driverProfiles, eq2(driverProfiles.userId, users.id)).where(eq2(users.id, userId));
          const [ride] = await db.select().from(rides).where(eq2(rides.id, rideId));
          if (!ride) {
            socket.emit("error", { message: "Ride not found" });
            return;
          }
          let rideData = activeRides.get(rideId);
          if (!rideData) {
            rideData = {
              rideId,
              riderId: ride.riderId,
              driverId: userId,
              status: "accepted"
            };
            activeRides.set(rideId, rideData);
          }
          rideData.driverId = userId;
          rideData.driverSocketId = socket.id;
          rideData.status = "accepted";
          const driver = onlineDrivers.get(userId);
          if (driver) {
            driver.status = "on_ride";
          }
          platformMetrics.activeRides = activeRides.size;
          if (rideData.riderSocketId) {
            const driverLocation = driver?.location;
            io.to(rideData.riderSocketId).emit("ride:driver_assigned", {
              driver: {
                id: userId,
                ...driverInfo,
                location: driverLocation
              },
              rideId
            });
          }
          const pendingRequest = pendingRideRequests.get(rideId);
          if (pendingRequest) {
            clearTimeout(pendingRequest.timeout);
            pendingRideRequests.delete(rideId);
          }
          io.to("admin-room").emit("ride:accepted", {
            rideId,
            driverId: userId,
            riderId: ride.riderId
          });
          console.log(`\u2705 Driver ${userId} accepted ride ${rideId}`);
        } catch (error) {
          console.error("Error accepting ride:", error);
          socket.emit("error", { message: "Failed to accept ride" });
        }
      });
      socket.on("ride:reject", async (data) => {
        const { rideId } = data;
        console.log(`\u274C Driver ${userId} rejected ride ${rideId}`);
        await findNextAvailableDriver(rideId, userId);
      });
      socket.on("ride:start", async (data) => {
        const { rideId } = data;
        if (!db) return;
        try {
          await getDb2().update(rides).set({
            status: "in_progress",
            startedAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq2(rides.id, rideId));
          const rideData = activeRides.get(rideId);
          if (rideData) {
            rideData.status = "in_progress";
            if (rideData.riderSocketId) {
              io.to(rideData.riderSocketId).emit("ride:started", { rideId });
            }
          }
          io.to("admin-room").emit("ride:started", { rideId });
          console.log(`\u{1F697} Ride ${rideId} started`);
        } catch (error) {
          console.error("Error starting ride:", error);
        }
      });
      socket.on("ride:complete", async (data) => {
        const { rideId } = data;
        if (!db) return;
        try {
          const [ride] = await db.select().from(rides).where(eq2(rides.id, rideId));
          if (!ride) return;
          await getDb2().update(rides).set({
            status: "completed",
            completedAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq2(rides.id, rideId));
          await getDb2().update(driverProfiles).set({
            totalRides: sql3`${driverProfiles.totalRides} + 1`,
            totalEarnings: sql3`${driverProfiles.totalEarnings} + ${ride.actualFare || ride.estimatedFare}`,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq2(driverProfiles.userId, userId));
          const rideData = activeRides.get(rideId);
          if (rideData) {
            if (rideData.riderSocketId) {
              io.to(rideData.riderSocketId).emit("ride:completed", { rideId });
            }
            activeRides.delete(rideId);
          }
          const driver = onlineDrivers.get(userId);
          if (driver) {
            driver.status = "online";
          }
          platformMetrics.activeRides = activeRides.size;
          platformMetrics.todayRides += 1;
          platformMetrics.todayRevenue += Number(ride.actualFare || ride.estimatedFare || 0);
          io.to("admin-room").emit("ride:completed", { rideId });
          io.to("admin-room").emit("platform:metrics", platformMetrics);
          console.log(`\u2705 Ride ${rideId} completed`);
        } catch (error) {
          console.error("Error completing ride:", error);
        }
      });
    }
    if (userType === "rider") {
      socket.on("ride:request", async (rideRequest) => {
        try {
          console.log(`\u{1F695} Ride request from rider ${userId}:`, rideRequest);
          const [newRide] = await getDb2().insert(rides).values({
            riderId: userId,
            pickupLocation: rideRequest.pickup.address,
            pickupLat: rideRequest.pickup.lat.toString(),
            pickupLng: rideRequest.pickup.lng.toString(),
            dropoffLocation: rideRequest.drop.address,
            dropoffLat: rideRequest.drop.lat.toString(),
            dropoffLng: rideRequest.drop.lng.toString(),
            vehicleType: rideRequest.vehicleType,
            distance: rideRequest.distance.toString(),
            estimatedFare: rideRequest.fare.toString(),
            status: "pending"
          }).returning();
          if (!newRide) {
            socket.emit("error", { message: "Failed to create ride" });
            return;
          }
          activeRides.set(newRide.id, {
            rideId: newRide.id,
            riderId: userId,
            driverId: "",
            riderSocketId: socket.id,
            status: "pending"
          });
          const nearbyDrivers = await findNearbyDrivers(
            rideRequest.pickup.lat,
            rideRequest.pickup.lng,
            rideRequest.vehicleType,
            5e3
            // 5km radius
          );
          if (nearbyDrivers.length === 0) {
            socket.emit("ride:no_drivers", { message: "No drivers available nearby" });
            await getDb2().update(rides).set({ status: "cancelled", cancelledAt: /* @__PURE__ */ new Date() }).where(eq2(rides.id, newRide.id));
            activeRides.delete(newRide.id);
            return;
          }
          const rideDetails = {
            id: newRide.id,
            riderId: userId,
            pickup: rideRequest.pickup,
            drop: rideRequest.drop,
            vehicleType: rideRequest.vehicleType,
            fare: rideRequest.fare,
            distance: rideRequest.distance,
            status: "pending"
          };
          const timeout = setTimeout(() => {
            findNextAvailableDriver(newRide.id);
          }, 3e4);
          pendingRideRequests.set(newRide.id, {
            rideRequest,
            requestedDrivers: /* @__PURE__ */ new Set([nearbyDrivers[0].userId]),
            timeout
          });
          const firstDriver = onlineDrivers.get(nearbyDrivers[0].userId);
          if (firstDriver) {
            io.to(firstDriver.socketId).emit("ride:request", rideDetails);
          }
          console.log(`\u{1F4E4} Ride request sent to driver ${nearbyDrivers[0].userId}`);
        } catch (error) {
          console.error("Error creating ride:", error);
          socket.emit("error", { message: "Failed to create ride" });
        }
      });
      socket.on("ride:cancel", async (data) => {
        const { rideId } = data;
        try {
          await getDb2().update(rides).set({
            status: "cancelled",
            cancelledAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq2(rides.id, rideId));
          const rideData = activeRides.get(rideId);
          if (rideData) {
            if (rideData.driverSocketId) {
              io.to(rideData.driverSocketId).emit("ride:cancelled", { rideId });
            }
            activeRides.delete(rideId);
          }
          const pendingRequest = pendingRideRequests.get(rideId);
          if (pendingRequest) {
            clearTimeout(pendingRequest.timeout);
            pendingRideRequests.delete(rideId);
          }
          platformMetrics.activeRides = activeRides.size;
          io.to("admin-room").emit("ride:cancelled", { rideId });
          console.log(`\u274C Ride ${rideId} cancelled by rider`);
        } catch (error) {
          console.error("Error cancelling ride:", error);
        }
      });
    }
    if (userType === "admin") {
      socket.join("admin-room");
      socket.on("admin:get_all_drivers", async () => {
        const driversData = [];
        const driversList = Array.from(onlineDrivers.entries());
        for (const [userId2, driver] of driversList) {
          try {
            const [userInfo] = await db.select({
              name: users.name,
              phone: users.phone
            }).from(users).where(eq2(users.id, userId2));
            driversData.push({
              id: userId2,
              name: userInfo?.name || "Unknown",
              location: driver.location,
              status: driver.status,
              lastUpdate: driver.lastUpdate
            });
          } catch (error) {
            console.error("Error fetching driver info:", error);
          }
        }
        socket.emit("admin:all_drivers", { drivers: driversData });
      });
      socket.on("admin:get_active_rides", async () => {
        const ridesData = [];
        const ridesList = Array.from(activeRides.entries());
        for (const [rideId, ride] of ridesList) {
          try {
            const [rideInfo] = await getDb2().select().from(rides).where(eq2(rides.id, rideId));
            if (rideInfo) {
              ridesData.push({
                ...rideInfo,
                ...ride
                // Spread ride to get in-memory status updates
              });
            }
          } catch (error) {
            console.error("Error fetching ride info:", error);
          }
        }
        socket.emit("admin:active_rides", { rides: ridesData });
      });
      socket.emit("platform:metrics", platformMetrics);
    }
    socket.on("disconnect", () => {
      console.log(`\u274C ${userType} disconnected: ${userId}`);
      if (userType === "driver") {
        onlineDrivers.delete(userId);
        platformMetrics.activeDrivers = onlineDrivers.size;
        io.to("admin-room").emit("driver:status_changed", {
          driverId: userId,
          status: "offline"
        });
      }
      activeRides.forEach((ride, rideId) => {
        if (ride.riderSocketId === socket.id) {
          ride.riderSocketId = void 0;
        }
        if (ride.driverSocketId === socket.id) {
          ride.driverSocketId = void 0;
        }
      });
    });
  });
  setInterval(() => {
    const now = Date.now();
    const driversList = Array.from(onlineDrivers.entries());
    for (const [userId, driver] of driversList) {
      if (now - driver.lastUpdate > 6e4) {
        onlineDrivers.delete(userId);
        console.log(`\u{1F9F9} Cleaned up stale driver: ${userId}`);
      }
    }
    platformMetrics.activeDrivers = onlineDrivers.size;
  }, 3e4);
  return io;
}
async function findNearbyDrivers(lat, lng, vehicleType, radiusMeters = 5e3) {
  const nearbyDrivers = [];
  const driversList = Array.from(onlineDrivers.entries());
  for (const [userId, driver] of driversList) {
    if (driver.status !== "online") continue;
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
  nearbyDrivers.sort((a, b) => a.distance - b.distance);
  return nearbyDrivers;
}
async function findNextAvailableDriver(rideId, rejectedDriverId) {
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
    5e3
  );
  const nextDriver = nearbyDrivers.find((d) => !requestedDrivers.has(d.userId));
  if (!nextDriver) {
    const rideData = activeRides.get(rideId);
    if (rideData?.riderSocketId) {
      console.log(`\u274C No more drivers available for ride ${rideId}`);
    }
    try {
      await getDb2().update(rides).set({ status: "cancelled", cancelledAt: /* @__PURE__ */ new Date() }).where(eq2(rides.id, rideId));
    } catch (error) {
      console.error("Error cancelling ride:", error);
    }
    clearTimeout(pendingRequest.timeout);
    pendingRideRequests.delete(rideId);
    activeRides.delete(rideId);
    return;
  }
  requestedDrivers.add(nextDriver.userId);
  const driver = onlineDrivers.get(nextDriver.userId);
  if (driver) {
    console.log(`\u{1F4E4} Sending ride request to next driver: ${nextDriver.userId}`);
  }
}
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3;
  const \u03C61 = lat1 * Math.PI / 180;
  const \u03C62 = lat2 * Math.PI / 180;
  const \u0394\u03C6 = (lat2 - lat1) * Math.PI / 180;
  const \u0394\u03BB = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(\u0394\u03C6 / 2) * Math.sin(\u0394\u03C6 / 2) + Math.cos(\u03C61) * Math.cos(\u03C62) * Math.sin(\u0394\u03BB / 2) * Math.sin(\u0394\u03BB / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// server/routes.ts
if (process.env.NODE_ENV !== "production") {
  config3();
}
var SIMPLE_AUTH2 = process.env.SIMPLE_AUTH === "true";
console.log("\u{1F527} Environment check:", {
  SIMPLE_AUTH: SIMPLE_AUTH2,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "SET" : "NOT SET",
  NODE_ENV: process.env.NODE_ENV
});
if (!admin.apps.length) {
  const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || // Final fallback to current public project id to prevent runtime failures on cold starts
  "trusty-diorama-475905-c3";
  if (!process.env.GOOGLE_CLOUD_PROJECT && PROJECT_ID) {
    process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;
  }
  admin.initializeApp({
    projectId: PROJECT_ID
  });
}
var stripe = null;
if (!SIMPLE_AUTH2) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (key) {
    stripe = new Stripe(key);
  } else {
    console.warn("[payments] Stripe disabled: STRIPE_SECRET_KEY not set. Payment route will return 503 in production or mock in development.");
  }
}
async function verifyFirebaseToken(req, res, next) {
  if (req.session?.user) {
    req.firebaseUid = req.session.user.firebaseUid;
    req.email = req.session.user.email;
    return next();
  }
  if (SIMPLE_AUTH2) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.substring(7);
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.firebaseUid = decodedToken.uid;
    req.email = decodedToken.email;
    next();
  } catch (_error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
function registerSimpleAuth(app2) {
  app2.post("/api/auth/login", (req, res) => {
    const { email, name, role } = req.body || {};
    if (!email || !name || !role) {
      return res.status(400).json({ error: "email, name, and role are required" });
    }
    req.session.user = {
      firebaseUid: `local-${email}`,
      email,
      name,
      role
    };
    res.json({ success: true });
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });
}
function generateReferralCode(name) {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const namePart = name.substring(0, 3).toUpperCase();
  return `${namePart}${randomPart}`;
}
async function registerRoutes(app2) {
  if (SIMPLE_AUTH2 || process.env.ALLOW_SIMPLE_AUTH_ROUTES === "true") {
    console.log(`[auth] registering simple-auth routes (SIMPLE_AUTH=${SIMPLE_AUTH2}, ALLOW_SIMPLE_AUTH_ROUTES=${process.env.ALLOW_SIMPLE_AUTH_ROUTES})`);
    registerSimpleAuth(app2);
    app2.post("/api/auth/email-otp/request", (req, res) => {
      try {
        const { email } = req.body || {};
        const result = requestEmailOtp(email);
        res.json({ success: true, debugCode: result.debugCode });
      } catch (e) {
        res.status(400).json({ error: e?.message || "Invalid email" });
      }
    });
    app2.post("/api/auth/email-otp/verify", (req, res) => {
      try {
        const { email, otp, name, role } = req.body || {};
        if (!email || !otp) return res.status(400).json({ error: "email and otp are required" });
        const ok = verifyEmailOtp(email, otp);
        if (!ok) return res.status(401).json({ error: "Invalid or expired OTP" });
        const safeName = name && String(name) || email.split("@")[0] + " User";
        const safeRole = role === "driver" || role === "admin" ? role : "rider";
        req.session.user = {
          firebaseUid: `local-${String(email).toLowerCase()}`,
          email,
          name: safeName,
          role: safeRole
        };
        res.json({ success: true });
      } catch (e) {
        res.status(500).json({ error: e?.message || "Internal error" });
      }
    });
  }
  const verifyHandler = async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  app2.get("/api/auth/verify", verifyFirebaseToken, verifyHandler);
  app2.post("/api/auth/verify", verifyFirebaseToken, verifyHandler);
  app2.post("/api/auth/complete-profile", verifyFirebaseToken, async (req, res) => {
    try {
      const { name, phone, role } = req.body;
      if (!name || !role) {
        return res.status(400).json({ error: "Missing required fields: name, role" });
      }
      let user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (user) {
        return res.json(user);
      }
      const referralCode = generateReferralCode(name);
      user = await storage.createUser({
        firebaseUid: req.firebaseUid,
        email: req.email || `${name.toLowerCase().split(" ").join(".")}@example.com`,
        name,
        phone,
        role,
        referralCode,
        isActive: true
      });
      if (role === "driver") {
        await storage.createDriverProfile({
          userId: user.id,
          vehicleType: "e_rickshaw",
          vehicleNumber: "PENDING",
          licenseNumber: "PENDING",
          kycStatus: "pending",
          rating: "5.00",
          totalRides: 0,
          totalEarnings: "0",
          isAvailable: false,
          femalePrefEnabled: false
        });
      }
      res.json(user);
    } catch (error) {
      console.error("/api/auth/complete-profile error:", error);
      const message = (() => {
        if (!error) return "Unknown error";
        if (typeof error === "string") return error;
        if (error.message) return error.message;
        try {
          return JSON.stringify(error);
        } catch {
          return String(error);
        }
      })();
      if (process.env.NODE_ENV !== "production") {
        return res.status(500).json({ error: message });
      }
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
  app2.post("/api/auth/firebase-login", async (req, res) => {
    try {
      const { idToken, role, phone } = req.body || {};
      if (!idToken) return res.status(400).json({ error: "idToken is required" });
      const decoded = await admin.auth().verifyIdToken(idToken);
      const firebaseUid = decoded.uid;
      const email = decoded.email || void 0;
      const name = decoded.name || (email ? email.split("@")[0] + " User" : "RideConnect User");
      const phoneNumber = decoded.phone_number || (typeof phone === "string" ? phone : void 0);
      const selectedRole = role === "driver" || role === "admin" ? role : "rider";
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user && email) {
        const byEmail = await storage.getUserByEmail(email);
        if (byEmail) {
          user = await storage.updateUser(byEmail.id, { firebaseUid, phone: byEmail.phone || phoneNumber, role: byEmail.role || selectedRole });
        }
      }
      if (!user) {
        const referralCode = generateReferralCode(name);
        user = await storage.createUser({
          firebaseUid,
          email: email || `${firebaseUid}@example.com`,
          name,
          phone: phoneNumber,
          role: selectedRole,
          referralCode,
          isActive: true
        });
        if (selectedRole === "driver") {
          await storage.createDriverProfile({
            userId: user.id,
            vehicleType: "e_rickshaw",
            vehicleNumber: "PENDING",
            licenseNumber: "PENDING",
            kycStatus: "pending",
            rating: "5.00",
            totalRides: 0,
            totalEarnings: "0",
            isAvailable: false,
            femalePrefEnabled: false
          });
        }
      } else if (phoneNumber && !user.phone) {
        user = await storage.updateUser(user.id, { phone: phoneNumber });
      }
      req.session.user = {
        firebaseUid,
        email: user.email,
        name: user.name,
        role: user.role
      };
      res.json(user);
    } catch (e) {
      console.error("[auth] /api/auth/firebase-login error:", e);
      const msg = e?.message || "Invalid token";
      res.status(401).json({ error: msg });
    }
  });
  app2.post("/api/auth/firebase-login", async (req, res) => {
    try {
      const { idToken, role } = req.body || {};
      if (!idToken) return res.status(400).json({ error: "idToken is required" });
      const decoded = await admin.auth().verifyIdToken(idToken);
      const firebaseUid = decoded.uid;
      const email = decoded.email || void 0;
      const name = decoded.name || void 0;
      const phone = decoded.phone_number || void 0;
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        const referralCode = generateReferralCode(name || (email || "user"));
        user = await storage.createUser({
          firebaseUid,
          email: email || `${firebaseUid}@unknown`,
          name: name || (email ? email.split("@")[0] : "New User"),
          phone,
          role: role === "driver" || role === "admin" ? role : "rider",
          referralCode,
          isActive: true
        });
        if (user && user.role === "driver") {
          await storage.createDriverProfile({
            userId: user.id,
            vehicleType: "e_rickshaw",
            vehicleNumber: "PENDING",
            licenseNumber: "PENDING",
            kycStatus: "pending",
            rating: "5.00",
            totalRides: 0,
            totalEarnings: "0",
            isAvailable: false,
            femalePrefEnabled: false
          });
        }
      } else {
        const updates = {};
        if (!user.email && email) updates.email = email;
        if (!user.name && name) updates.name = name;
        if (!user.phone && phone) updates.phone = phone;
        if (Object.keys(updates).length) {
          user = await storage.updateUser(user.id, updates);
        }
      }
      req.session.user = {
        firebaseUid,
        email: user.email,
        name: user.name,
        role: user.role
      };
      return res.json(user);
    } catch (e) {
      return res.status(401).json({ error: e?.message || "Invalid ID token" });
    }
  });
  app2.get("/api/health", (_req, res) => {
    res.json({ ok: true, mode: SIMPLE_AUTH2 ? "simple" : "full" });
  });
  app2.get("/api/integrations/name-api/whoami", async (_req, res) => {
    try {
      const data = await nameApi_default.whoAmI();
      res.json({ ok: true, data });
    } catch (e) {
      res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
  });
  app2.get("/api/rider/stats", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const stats = await storage.getRiderStats(user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/rider/available-drivers", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (user.role !== "rider") {
        return res.status(403).json({ error: "Only riders can view available drivers" });
      }
      const drivers2 = await storage.listAvailableDrivers();
      res.json(drivers2);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/rider/rides", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const rides2 = await storage.getUserRides(user.id, "rider");
      res.json(rides2);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/rides", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (user.role !== "rider") {
        return res.status(403).json({ error: "Only riders can request rides" });
      }
      const {
        pickupLocation,
        pickupLat,
        pickupLng,
        dropoffLocation,
        dropoffLat,
        dropoffLng,
        vehicleType,
        femalePrefRequested
      } = req.body;
      const pickLabel = pickupLocation || `Pickup (${Number(pickupLat).toFixed(5)}, ${Number(pickupLng).toFixed(5)})`;
      const dropLabel = dropoffLocation || `Drop (${Number(dropoffLat).toFixed(5)}, ${Number(dropoffLng).toFixed(5)})`;
      const distance = 5.5;
      const estimatedFare = vehicleType === "e_scooter" ? 30 : vehicleType === "e_rickshaw" ? 45 : 80;
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
        status: "pending",
        distance: distance.toString(),
        estimatedFare: estimatedFare.toString()
      });
      initiateRideMatching(req.app, ride.id, Number(pickupLat), Number(pickupLng), Number(dropoffLat), Number(dropoffLng), vehicleType, estimatedFare);
      res.status(201).json({ id: ride.id, status: "searching" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/rides/:id", verifyFirebaseToken, async (req, res) => {
    try {
      const ride = await storage.getRide(req.params.id);
      if (!ride) {
        return res.status(404).json({ error: "Ride not found" });
      }
      res.json(ride);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/rides/:id/accept", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (user.role !== "driver") {
        return res.status(403).json({ error: "Only drivers can accept rides" });
      }
      const ride = await storage.getRide(req.params.id);
      if (!ride) {
        return res.status(404).json({ error: "Ride not found" });
      }
      if (ride.status !== "pending") {
        return res.status(400).json({ error: "Ride is no longer available" });
      }
      const driverProfile = await storage.getDriverProfile(user.id);
      if (!driverProfile?.isAvailable) {
        return res.status(400).json({ error: "Driver is not available" });
      }
      const updatedRide = await storage.updateRide(req.params.id, {
        driverId: user.id,
        status: "accepted",
        acceptedAt: /* @__PURE__ */ new Date()
      });
      try {
        const wssLocal = req.app.locals?.wss;
        if (wssLocal) {
          wssLocal.clients.forEach((client) => {
            if (client.readyState === WebSocket2.OPEN) {
              client.send(JSON.stringify({
                type: "ride_accepted",
                rideId: updatedRide.id,
                driverId: user.id,
                at: Date.now()
              }));
            }
          });
        }
      } catch {
      }
      res.json(updatedRide);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/rides/:id/complete", verifyFirebaseToken, async (req, res) => {
    try {
      const { actualFare } = req.body;
      const ride = await storage.getRide(req.params.id);
      if (!ride) {
        return res.status(404).json({ error: "Ride not found" });
      }
      const updatedRide = await storage.updateRide(req.params.id, {
        status: "completed",
        actualFare: actualFare || ride.estimatedFare,
        completedAt: /* @__PURE__ */ new Date()
      });
      if (ride.driverId) {
        const driverProfile = await storage.getDriverProfile(ride.driverId);
        if (driverProfile) {
          await storage.updateDriverProfile(ride.driverId, {
            totalRides: driverProfile.totalRides + 1,
            totalEarnings: (Number(driverProfile.totalEarnings) + Number(actualFare || ride.estimatedFare)).toString()
          });
        }
      }
      res.json(updatedRide);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/rides/:id/start", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) return res.status(404).json({ error: "User not found" });
      const ride = await storage.getRide(req.params.id);
      if (!ride) return res.status(404).json({ error: "Ride not found" });
      if (ride.driverId && ride.driverId !== user.id) {
        return res.status(403).json({ error: "Not your ride" });
      }
      const updated = await storage.updateRide(req.params.id, {
        driverId: ride.driverId || user.id,
        status: "in_progress",
        startedAt: /* @__PURE__ */ new Date()
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/rides/:id/sos", verifyFirebaseToken, async (req, res) => {
    try {
      const ride = await storage.getRide(req.params.id);
      if (!ride) return res.status(404).json({ error: "Ride not found" });
      await storage.updateRide(req.params.id, {});
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/driver/stats", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const stats = await storage.getDriverStats(user.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/driver/pending-rides", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (user.role !== "driver") {
        return res.status(403).json({ error: "Only drivers can view pending rides" });
      }
      const driverProfile = await storage.getDriverProfile(user.id);
      if (!driverProfile?.isAvailable) {
        return res.json([]);
      }
      const rides2 = await storage.getPendingRides();
      res.json(rides2);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.put("/api/driver/availability", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (user.role !== "driver") {
        return res.status(403).json({ error: "Only drivers can set availability" });
      }
      const { available, is_online, current_lat, current_lng } = req.body || {};
      const online = typeof is_online === "boolean" ? is_online : !!available;
      const updated = await storage.updateDriverProfile(user.id, {
        isAvailable: online
      });
      const lat = typeof current_lat === "number" ? current_lat : void 0;
      const lng = typeof current_lng === "number" ? current_lng : void 0;
      const vehicleType = updated.vehicleType;
      const rating = updated.rating ? Number(updated.rating) : void 0;
      const p = setDriverOnline(user.id, online, lat, lng, vehicleType, rating);
      try {
        const wssLocal = req.app.locals?.wss;
        if (wssLocal) {
          const payload = JSON.stringify({
            type: online ? "driver_online" : "driver_offline",
            driverId: user.id,
            vehicleType,
            lat: p.lat,
            lng: p.lng,
            at: Date.now()
          });
          wssLocal.clients.forEach((client) => {
            if (client.readyState === WebSocket2.OPEN) client.send(payload);
          });
        }
      } catch {
      }
      res.json({ success: true, profile: updated, presence: p });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/admin/stats", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/admin/active-rides", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const rides2 = await storage.getActiveRides();
      res.json(rides2);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/create-payment-intent", verifyFirebaseToken, async (req, res) => {
    try {
      const { amount } = req.body;
      if (!stripe) {
        if (process.env.NODE_ENV !== "production") {
          return res.json({ clientSecret: `mock_${Math.round(amount * 100)}` });
        }
        return res.status(503).json({ error: "Payments unavailable: Stripe is not configured" });
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "inr"
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  const httpServer = createServer(app2);
  const io = initializeSocketIO(httpServer);
  console.log("\u{1F680} Socket.IO initialized for real-time ride management");
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  app2.locals.wss = wss;
  app2.locals.io = io;
  wss.on("connection", (ws2) => {
    console.log("Client connected to WebSocket");
    ws2.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "location_update") {
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket2.OPEN) {
              client.send(JSON.stringify({
                type: "location_update",
                rideId: data.rideId,
                lat: data.lat,
                lng: data.lng,
                who: data.who || "unknown",
                at: Date.now()
              }));
            }
          });
        }
        if (data.type === "iam_driver" && data.userId) {
          registerDriverSocket(data.userId, ws2);
        }
        if (data.type === "driver_online") {
          setDriverOnline(data.userId, true, data.lat, data.lng, data.vehicleType, data.rating);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    ws2.on("close", () => {
      console.log("Client disconnected from WebSocket");
      unregisterSocket(ws2);
    });
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "icons/icon-192x192.png",
        "icons/icon-512x512.png"
      ],
      manifest: {
        name: "EcoRide Connect",
        short_name: "EcoRide",
        description: "Eco-friendly ridesharing platform",
        theme_color: "#00A86B",
        background_color: "#ffffff",
        start_url: "/",
        scope: "/",
        display: "standalone",
        display_override: ["standalone"],
        orientation: "portrait",
        categories: ["travel", "navigation"],
        prefer_related_applications: false,
        icons: [
          { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
        ],
        shortcuts: [
          { name: "Book a Ride", url: "/rider", short_name: "Rider" },
          { name: "Drive", url: "/driver", short_name: "Driver" }
        ]
      }
    }),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: (() => {
    const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";
    return {
      outDir: isVercel ? path.resolve(import.meta.dirname, "client", "dist") : path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      // Reduce noisy warnings and split large vendor bundles for faster loads on Vercel
      chunkSizeWarningLimit: 1500,
      // KB; only affects warning threshold, not output
      rollupOptions: {
        output: {
          // Auto-split vendor code by top-level package to avoid a single huge chunk
          manualChunks(id) {
            if (id.includes("node_modules")) {
              const parts = id.toString().split("node_modules/")[1].split("/");
              const pkg = parts[0].startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
              return pkg;
            }
          }
        }
      }
    };
  })(),
  // Allow overriding base path for different hosting targets.
  // Default keeps GH Pages base in production; Render sets VITE_BASE_PATH="/".
  base: process.env.VITE_BASE_PATH || (process.env.NODE_ENV === "production" ? "/Echo-Ride/" : "/"),
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  const distIcons = path2.resolve(distPath, "icons");
  app2.get("/icons/:file", (req, res) => {
    const file = req.params.file;
    const iconPath = path2.resolve(distIcons, file);
    if (fs.existsSync(iconPath)) {
      return res.sendFile(iconPath);
    }
    res.status(404).end();
  });
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
if (process.env.NODE_ENV !== "production") {
  config4();
}
var app = express2();
app.set("trust proxy", 1);
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
if (process.env.FRONTEND_ORIGIN) {
  app.use(
    cors({
      origin: process.env.FRONTEND_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true
    })
  );
}
var MemoryStore = MemoryStoreFactory(session);
var isCodespaces = !!process.env.CODESPACES;
var forceSecure = process.env.COOKIE_SECURE === "true";
var useSecureCookies = isCodespaces || forceSecure;
var sameSitePolicy = useSecureCookies ? "none" : "lax";
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-session-secret",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({ checkPeriod: 1e3 * 60 * 60 }),
    // prune expired every hour
    proxy: true,
    // honor X-Forwarded-* headers for secure cookies
    cookie: {
      secure: useSecureCookies,
      // required when served over HTTPS via proxy
      httpOnly: true,
      sameSite: sameSitePolicy,
      maxAge: 1e3 * 60 * 60 * 8
      // 8 hours
    }
  })
);
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
