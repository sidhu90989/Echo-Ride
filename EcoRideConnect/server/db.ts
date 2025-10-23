import { config } from "dotenv";
if (process.env.NODE_ENV !== 'production') {
  config();
}
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Determine if we should initialize the database
const SIMPLE_AUTH = process.env.SIMPLE_AUTH === 'true';

// eslint-disable-next-line no-console
console.log(`[db] module init. SIMPLE_AUTH=${process.env.SIMPLE_AUTH} DATABASE_URL=${process.env.DATABASE_URL ? 'SET' : 'MISSING'}`);

let pool: Pool | undefined;
let db: ReturnType<typeof drizzle> | undefined;

if (!SIMPLE_AUTH) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  }
  // Configure Neon only when using DB
  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
  // eslint-disable-next-line no-console
  console.log('[db] SIMPLE_AUTH=true -> skipping Neon/drizzle initialization');
}

export { pool, db };
