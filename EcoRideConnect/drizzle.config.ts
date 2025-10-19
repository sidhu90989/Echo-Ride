/// <reference types="node" />
import "dotenv/config"; // Load .env so DATABASE_URL is available when running drizzle CLI
import { defineConfig } from "drizzle-kit";

// Resolve DATABASE_URL from environment; fall back to a local dev URL if missing
const databaseUrl = process.env.DATABASE_URL || "postgresql://localhost:5432/ecoride";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
