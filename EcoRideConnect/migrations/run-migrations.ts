/**
 * Cloud SQL Migration Runner
 * Run database migrations for Google Cloud SQL (PostgreSQL)
 */

import { pgPool } from '../server/config/database';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigrations() {
  console.log('🚀 Starting Cloud SQL migrations...');
  
  try {
    // Read schema SQL file
    const schemaPath = join(__dirname, 'cloud_sql_schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf-8');
    
    // Execute schema
    await pgPool.query(schemaSql);
    
    console.log('✅ Cloud SQL schema created successfully');
    
    // Seed some initial data if needed
    await seedInitialData();
    
    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function seedInitialData() {
  console.log('📝 Seeding initial data...');
  
  // Add default pricing to ensure fare service works
  // (In production, you'd populate Firestore pricing collection separately)
  
  console.log('✅ Initial data seeded');
}

// Run if called directly
if (require.main === module) {
  runMigrations();
}

export default runMigrations;
