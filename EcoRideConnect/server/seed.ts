import { db as maybeDb } from "./db";
import {
  users,
  driverProfiles,
  type InsertUser,
  type InsertDriverProfile,
} from "@shared/schema";

export async function seed() {
  try {
    console.log("🌱 Seeding database...");
    const db = maybeDb!;

    // Create sample users
    const sampleUsers: InsertUser[] = [
      {
        firebaseUid: "demo-rider-1",
        email: "rider@demo.com",
        name: "Demo Rider",
        phone: "+91-9876543210",
        role: "rider",
        referralCode: "RIDER123",
      },
      {
        firebaseUid: "demo-driver-1",
        email: "driver@demo.com",
        name: "Demo Driver",
        phone: "+91-9876543211",
        role: "driver",
        referralCode: "DRIVER456",
      },
      {
        firebaseUid: "demo-admin-1",
        email: "admin@demo.com",
        name: "Demo Admin",
        phone: "+91-9876543212",
        role: "admin",
        referralCode: "ADMIN789",
      },
    ];

    console.log("👥 Creating sample users...");
  const createdUsers = await db.insert(users).values(sampleUsers).returning();

    // Create driver profile for the demo driver
    const driverUser = createdUsers.find(u => u.email === "driver@demo.com");
    if (driverUser) {
      const driverProfile: InsertDriverProfile = {
        userId: driverUser.id,
        vehicleType: "e_rickshaw",
        vehicleNumber: "DL-01-AA-1234",
        vehicleModel: "Mahindra Treo",
        licenseNumber: "DL1234567890",
        kycStatus: "verified",
        rating: "4.8",
        totalRides: 245,
        totalEarnings: "12500.50",
        isAvailable: true,
        femalePrefEnabled: false,
      };

      console.log("🚗 Creating driver profile...");
      await db.insert(driverProfiles).values(driverProfile);
    }

    console.log("✅ Database seeded successfully!");
    console.log(`
📊 Created:
  - ${sampleUsers.length} sample users (rider, driver, admin)
  - 1 driver profile

🔑 Demo login credentials:
  - Rider: rider@demo.com
  - Driver: driver@demo.com  
  - Admin: admin@demo.com
    `);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}
