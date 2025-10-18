import { db } from "./db";
import { ecoBadges } from "@shared/schema";

async function seed() {
  console.log("Seeding eco badges...");

  const badges = [
    {
      name: "Green Beginner",
      description: "Complete your first eco-friendly ride",
      iconName: "leaf",
      requiredPoints: 10,
    },
    {
      name: "Eco Warrior",
      description: "Save 10kg of CO₂",
      iconName: "shield",
      requiredPoints: 100,
    },
    {
      name: "Planet Protector",
      description: "Complete 25 eco-rides",
      iconName: "globe",
      requiredPoints: 250,
    },
    {
      name: "Green Champion",
      description: "Save 50kg of CO₂",
      iconName: "trophy",
      requiredPoints: 500,
    },
    {
      name: "Climate Hero",
      description: "Complete 100 eco-rides",
      iconName: "star",
      requiredPoints: 1000,
    },
  ];

  for (const badge of badges) {
    await db.insert(ecoBadges).values(badge);
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
