import { db as maybeDb } from "./db";
import {
  users,
  driverProfiles,
  ecoBadges,
  type InsertEcoBadge,
  type InsertUser,
  type InsertDriverProfile,
} from "@shared/schema";

async function seed() {
  try {
    console.log("🌱 Seeding database...");
    const db = maybeDb!;

    // Create eco badges
    const badges: InsertEcoBadge[] = [
      {
        name: "Eco Starter",
        description: "Complete your first eco-friendly ride",
        iconName: "leaf",
        requiredPoints: 10,
      },
      {
        name: "Green Commuter",
        description: "Save 5kg of CO₂ through eco rides",
        iconName: "tree",
        requiredPoints: 50,
      },
      {
        name: "Climate Champion",
        description: "Save 25kg of CO₂ through eco rides",
        iconName: "award",
        requiredPoints: 250,
      },
      {
        name: "Eco Warrior",
        description: "Save 100kg of CO₂ through eco rides",
        iconName: "shield",
        requiredPoints: 1000,
      },
      {
        name: "Planet Protector",
        description: "Complete 100 eco-friendly rides",
        iconName: "globe",
        requiredPoints: 500,
      },
    ];

    console.log("📊 Creating eco badges...");
  await db.insert(ecoBadges).values(badges);

    // Create sample users
    const sampleUsers: InsertUser[] = [
      {
        firebaseUid: "demo-rider-1",
        email: "rider@demo.com",
        name: "Demo Rider",
        phone: "+91-9876543210",
        role: "rider",
        ecoPoints: 120,
        totalCO2Saved: "15.5",
        referralCode: "RIDER123",
      },
      {
        firebaseUid: "demo-driver-1",
        email: "driver@demo.com",
        name: "Demo Driver",
        phone: "+91-9876543211",
        role: "driver",
        ecoPoints: 350,
        totalCO2Saved: "45.2",
        referralCode: "DRIVER456",
      },
      {
        firebaseUid: "demo-admin-1",
        email: "admin@demo.com",
        name: "Demo Admin",
        phone: "+91-9876543212",
        role: "admin",
        ecoPoints: 0,
        totalCO2Saved: "0",
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
  - ${badges.length} eco badges
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

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log("🌱 Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}

export { seed };
