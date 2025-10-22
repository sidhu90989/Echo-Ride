import { seed } from "./seed";

seed()
  .then(() => {
    console.log("🌱 Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });
