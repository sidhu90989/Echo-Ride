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
  ecoBadges: () => ecoBadges,
  ecoBadgesRelations: () => ecoBadgesRelations,
  genderEnum: () => genderEnum,
  insertDriverProfileSchema: () => insertDriverProfileSchema,
  insertEcoBadgeSchema: () => insertEcoBadgeSchema,
  insertPaymentSchema: () => insertPaymentSchema,
  insertRatingSchema: () => insertRatingSchema,
  insertReferralSchema: () => insertReferralSchema,
  insertRideSchema: () => insertRideSchema,
  insertUserBadgeSchema: () => insertUserBadgeSchema,
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
  userBadges: () => userBadges,
  userBadgesRelations: () => userBadgesRelations,
  userRoleEnum: () => userRoleEnum,
  users: () => users,
  usersRelations: () => usersRelations,
  vehicleTypeEnum: () => vehicleTypeEnum
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var userRoleEnum, genderEnum, vehicleTypeEnum, rideStatusEnum, paymentMethodEnum, paymentStatusEnum, kycStatusEnum, users, driverProfiles, rides, payments, ratings, ecoBadges, userBadges, referrals, usersRelations, driverProfilesRelations, ridesRelations, paymentsRelations, ratingsRelations, ecoBadgesRelations, userBadgesRelations, referralsRelations, insertUserSchema, insertDriverProfileSchema, insertRideSchema, insertPaymentSchema, insertRatingSchema, insertEcoBadgeSchema, insertUserBadgeSchema, insertReferralSchema;
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
      ecoPoints: integer("eco_points").notNull().default(0),
      totalCO2Saved: decimal("total_co2_saved", { precision: 10, scale: 2 }).notNull().default("0"),
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
      co2Saved: decimal("co2_saved", { precision: 10, scale: 2 }),
      ecoPointsEarned: integer("eco_points_earned").default(0),
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
    ecoBadges = pgTable("eco_badges", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      name: text("name").notNull(),
      description: text("description"),
      iconName: text("icon_name").notNull(),
      requiredPoints: integer("required_points").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    userBadges = pgTable("user_badges", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      badgeId: varchar("badge_id").notNull().references(() => ecoBadges.id),
      earnedAt: timestamp("earned_at").notNull().defaultNow()
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
      badges: many(userBadges),
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
    ecoBadgesRelations = relations(ecoBadges, ({ many }) => ({
      userBadges: many(userBadges)
    }));
    userBadgesRelations = relations(userBadges, ({ one }) => ({
      user: one(users, {
        fields: [userBadges.userId],
        references: [users.id]
      }),
      badge: one(ecoBadges, {
        fields: [userBadges.badgeId],
        references: [ecoBadges.id]
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
    insertEcoBadgeSchema = createInsertSchema(ecoBadges).omit({
      id: true,
      createdAt: true
    });
    insertUserBadgeSchema = createInsertSchema(userBadges).omit({
      id: true,
      earnedAt: true
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
    config();
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
import { WebSocketServer, WebSocket } from "ws";

// server/storage.ts
init_schema();
import { config as config2 } from "dotenv";
import { eq, and, or, desc, sql as sql2 } from "drizzle-orm";
import { customAlphabet } from "nanoid";
config2();
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
  // Badge operations
  async getAllBadges() {
    const db2 = await getDb();
    return await db2.select().from(ecoBadges);
  }
  async getUserBadges(userId) {
    const db2 = await getDb();
    return await db2.select().from(userBadges).where(eq(userBadges.userId, userId));
  }
  async awardBadge(userBadge) {
    const db2 = await getDb();
    const [badge] = await db2.insert(userBadges).values(userBadge).returning();
    return badge;
  }
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
    const badgeCount = await db2.select({ count: sql2`count(*)` }).from(userBadges).where(eq(userBadges.userId, userId));
    return {
      totalRides: userRides.length,
      ecoPoints: user?.ecoPoints || 0,
      totalCO2Saved: user?.totalCO2Saved || "0",
      badgesEarned: badgeCount[0]?.count || 0
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
    const totalCO2 = completedRides.reduce((sum, ride) => {
      return sum + Number(ride.co2Saved || 0);
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
      totalCO2Saved: totalCO2.toFixed(2),
      totalRides: allRides.length,
      todayRides: todayRides.length,
      weekRides: allRides.length,
      monthRides: allRides.length,
      vehicleStats
    };
  }
};
var MemoryStorage = class {
  id = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);
  _users = [];
  _driverProfiles = [];
  _rides = [];
  _payments = [];
  _ratings = [];
  _ecoBadges = [
    { id: this.id(), name: "Green Beginner", description: "Complete your first eco-friendly ride", iconName: "leaf", requiredPoints: 10, createdAt: /* @__PURE__ */ new Date() },
    { id: this.id(), name: "Eco Warrior", description: "Save 10kg of CO\u2082", iconName: "shield", requiredPoints: 100, createdAt: /* @__PURE__ */ new Date() },
    { id: this.id(), name: "Planet Protector", description: "Complete 25 eco-rides", iconName: "globe", requiredPoints: 250, createdAt: /* @__PURE__ */ new Date() }
  ];
  _userBadges = [];
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
      ecoPoints: 0,
      totalCO2Saved: "0",
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
  async getAllBadges() {
    return this._ecoBadges;
  }
  async getUserBadges(userId) {
    return this._userBadges.filter((ub) => ub.userId === userId);
  }
  async awardBadge(userBadge) {
    const ub = { id: this.id(), ...userBadge, earnedAt: /* @__PURE__ */ new Date() };
    this._userBadges.push(ub);
    return ub;
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
    const badges = this._userBadges.filter((ub) => ub.userId === userId);
    return {
      totalRides: completed.length,
      ecoPoints: user?.ecoPoints ?? 0,
      totalCO2Saved: user?.totalCO2Saved ?? "0",
      badgesEarned: badges.length
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
    const totalCO2 = completed.reduce((s, r) => s + Number(r.co2Saved || 0), 0);
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
      totalCO2Saved: totalCO2.toFixed(2),
      totalRides: allRides.length,
      todayRides: todayRides.length,
      weekRides: allRides.length,
      monthRides: allRides.length,
      vehicleStats
    };
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

// server/routes.ts
config3();
var SIMPLE_AUTH2 = process.env.SIMPLE_AUTH === "true";
console.log("\u{1F527} Environment check:", {
  SIMPLE_AUTH: SIMPLE_AUTH2,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "SET" : "NOT SET",
  NODE_ENV: process.env.NODE_ENV
});
if (!SIMPLE_AUTH2) {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
}
var stripe = (() => {
  if (SIMPLE_AUTH2) return null;
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
})();
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
  } catch (error) {
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
        ecoPoints: 0,
        totalCO2Saved: "0",
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
  app2.get("/api/rider/badges", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const allBadges = await storage.getAllBadges();
      const userBadges2 = await storage.getUserBadges(user.id);
      const earnedBadgeIds = new Set(userBadges2.map((ub) => ub.badgeId));
      const badgesWithStatus = allBadges.map((badge) => ({
        ...badge,
        earned: earnedBadgeIds.has(badge.id)
      }));
      res.json(badgesWithStatus);
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
      const distance = 5.5;
      const estimatedFare = vehicleType === "e_scooter" ? 30 : vehicleType === "e_rickshaw" ? 45 : 80;
      const co2Saved = distance * 0.12;
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
        status: "pending",
        distance: distance.toString(),
        estimatedFare: estimatedFare.toString(),
        co2Saved: co2Saved.toString(),
        ecoPointsEarned: ecoPoints
      });
      res.json(ride);
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
      const rider = await storage.getUser(ride.riderId);
      if (rider) {
        await storage.updateUser(ride.riderId, {
          ecoPoints: rider.ecoPoints + (ride.ecoPointsEarned || 0),
          totalCO2Saved: (Number(rider.totalCO2Saved) + Number(ride.co2Saved || 0)).toString()
        });
      }
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
      const { available } = req.body;
      await storage.updateDriverProfile(user.id, {
        isAvailable: available
      });
      res.json({ success: true });
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
        return res.json({ clientSecret: `mock_${Math.round(amount * 100)}` });
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
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws2) => {
    console.log("Client connected to WebSocket");
    ws2.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "location_update") {
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
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
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    ws2.on("close", () => {
      console.log("Client disconnected from WebSocket");
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
      manifest: {
        name: "EcoRide Connect",
        short_name: "EcoRide",
        description: "Eco-friendly ridesharing platform",
        theme_color: "#00A86B",
        background_color: "#ffffff",
        icons: [
          { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
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
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
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
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
config4();
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
