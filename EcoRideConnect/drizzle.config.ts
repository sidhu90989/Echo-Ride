/// <reference types="node" />
import { defineConfig } from "drizzle-kit";

// Allow generating migrations without DATABASE_URL for development
const databaseUrl = process.env.DATABASE_URL || "postgresql://localhost:5432/ecoride";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
