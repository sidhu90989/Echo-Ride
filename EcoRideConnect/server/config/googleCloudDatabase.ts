/**
 * Google Cloud Database Architecture Configuration
 * Integrates Cloud SQL (PostgreSQL), Firestore, and Memorystore (Redis)
 */

import { Pool } from 'pg';
import { Firestore } from '@google-cloud/firestore';
import Redis from 'ioredis';

// Database connection pools
let pgPool: Pool | null = null;
let firestoreClient: Firestore | null = null;
let redisClient: Redis | null = null;

/**
 * Initialize Google Cloud SQL (PostgreSQL)
 * For structured relational data: users, rides, transactions
 */
export async function initCloudSQL(): Promise<Pool> {
  if (pgPool) {
    return pgPool;
  }
  
  const config = {
    host: process.env.CLOUD_SQL_HOST || '127.0.0.1',
    port: parseInt(process.env.CLOUD_SQL_PORT || '5432'),
    user: process.env.CLOUD_SQL_USER || 'postgres',
    password: process.env.CLOUD_SQL_PASSWORD || '',
    database: process.env.CLOUD_SQL_DATABASE || 'rideconnect',
    max: 20, // Maximum connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
  
  // For Cloud SQL Proxy connection
  if (process.env.CLOUD_SQL_CONNECTION_NAME) {
    config.host = `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`;
  }
  
  pgPool = new Pool(config);
  
  // Test connection
  try {
    const client = await pgPool.connect();
    console.log('✅ Connected to Google Cloud SQL (PostgreSQL)');
    client.release();
  } catch (error) {
    console.error('❌ Cloud SQL connection failed:', error);
    console.warn('⚠️ Continuing without Cloud SQL - using Firestore only');
  }
  
  return pgPool;
}

/**
 * Initialize Google Cloud Firestore
 * For flexible NoSQL data: ride requests, real-time updates, configuration
 */
export function initFirestore(): Firestore {
  if (firestoreClient) {
    return firestoreClient;
  }
  
  firestoreClient = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'trusty-diorama-475905-c3',
    // Credentials automatically loaded from GOOGLE_APPLICATION_CREDENTIALS env var
  });
  
  console.log('✅ Connected to Google Cloud Firestore');
  return firestoreClient;
}

/**
 * Initialize Google Cloud Memorystore (Redis)
 * For caching and real-time geospatial data
 */
export async function initMemorystore(): Promise<Redis> {
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }
  
  const config: any = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  };
  
  // Add password if available (Memorystore with AUTH enabled)
  if (process.env.REDIS_PASSWORD) {
    config.password = process.env.REDIS_PASSWORD;
  }
  
  redisClient = new Redis(config);
  
  try {
    await redisClient.connect();
    console.log('✅ Connected to Google Cloud Memorystore (Redis)');
  } catch (error) {
    console.error('❌ Memorystore connection failed:', error);
    console.warn('⚠️ Continuing without Redis - using in-memory cache');
  }
  
  return redisClient;
}

/**
 * Initialize all Google Cloud databases
 */
export async function initializeGoogleCloudDatabases(): Promise<void> {
  console.log('🚀 Initializing Google Cloud databases...');
  
  try {
    // Initialize in parallel
    await Promise.all([
      initCloudSQL().catch(err => console.warn('Cloud SQL initialization skipped:', err.message)),
      initFirestore(),
      initMemorystore().catch(err => console.warn('Memorystore initialization skipped:', err.message))
    ]);
    
    console.log('✅ Google Cloud databases initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

/**
 * Get Cloud SQL connection pool
 */
export function getCloudSQL(): Pool {
  if (!pgPool) {
    throw new Error('Cloud SQL not initialized. Call initCloudSQL() first.');
  }
  return pgPool;
}

/**
 * Get Firestore client
 */
export function getFirestore(): Firestore {
  if (!firestoreClient) {
    return initFirestore();
  }
  return firestoreClient;
}

/**
 * Get Redis client
 */
export function getRedis(): Redis {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call initMemorystore() first.');
  }
  return redisClient;
}

/**
 * Close all database connections
 */
export async function closeDatabaseConnections(): Promise<void> {
  console.log('🔌 Closing database connections...');
  
  const promises = [];
  
  if (pgPool) {
    promises.push(
      pgPool.end().then(() => {
        console.log('✅ Cloud SQL connection closed');
        pgPool = null;
      })
    );
  }
  
  if (redisClient) {
    promises.push(
      redisClient.quit().then(() => {
        console.log('✅ Redis connection closed');
        redisClient = null;
      })
    );
  }
  
  if (firestoreClient) {
    // Firestore doesn't need explicit closing
    firestoreClient = null;
    console.log('✅ Firestore client released');
  }
  
  await Promise.all(promises);
  console.log('✅ All database connections closed');
}

/**
 * Data Storage Strategy Guide
 * 
 * CLOUD SQL (PostgreSQL) - Structured, relational data:
 * - users (id, phone, name, role, created_at)
 * - driver_profiles (id, user_id, vehicle_type, vehicle_number, rating)
 * - rides (id, rider_id, driver_id, status, fare, created_at, completed_at)
 * - transactions (id, ride_id, amount, method, status, timestamp)
 * - payouts (id, driver_id, ride_id, amount, platform_fee, net_amount)
 * 
 * FIRESTORE - Flexible, real-time data:
 * - ride_requests (active requests awaiting driver)
 * - pricing (dynamic pricing configuration by vehicle type)
 * - wallets (user wallet balances)
 * - payment_failures (payment error logs)
 * - driver_metadata (additional driver information)
 * 
 * MEMORYSTORE (Redis) - Cache, geospatial, temporary data:
 * - drivers:active:{city} (geospatial index of online drivers)
 * - driver:{id}:metadata (current location, speed, heading)
 * - ride:{id}:status (temporary ride status cache)
 * - surge:{location} (surge pricing cache)
 */

// Export type for database clients
export interface DatabaseClients {
  sql: Pool | null;
  firestore: Firestore;
  redis: Redis | null;
}

/**
 * Get all database clients
 */
export function getDatabaseClients(): DatabaseClients {
  return {
    sql: pgPool,
    firestore: firestoreClient || initFirestore(),
    redis: redisClient
  };
}

/**
 * Health check for all databases
 */
export async function checkDatabaseHealth(): Promise<{
  cloudSQL: boolean;
  firestore: boolean;
  memorystore: boolean;
}> {
  const health = {
    cloudSQL: false,
    firestore: false,
    memorystore: false
  };
  
  // Check Cloud SQL
  if (pgPool) {
    try {
      const client = await pgPool.connect();
      await client.query('SELECT 1');
      client.release();
      health.cloudSQL = true;
    } catch (error) {
      console.error('Cloud SQL health check failed:', error);
    }
  }
  
  // Check Firestore
  if (firestoreClient) {
    try {
      await firestoreClient.collection('_health_check').limit(1).get();
      health.firestore = true;
    } catch (error) {
      console.error('Firestore health check failed:', error);
    }
  }
  
  // Check Redis
  if (redisClient && redisClient.status === 'ready') {
    try {
      await redisClient.ping();
      health.memorystore = true;
    } catch (error) {
      console.error('Redis health check failed:', error);
    }
  }
  
  return health;
}

/**
 * Create database tables (Cloud SQL schema)
 */
export async function createDatabaseSchema(): Promise<void> {
  if (!pgPool) {
    console.warn('⚠️ Cloud SQL not available, skipping schema creation');
    return;
  }
  
  const client = await pgPool.connect();
  
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255),
        role VARCHAR(20) NOT NULL CHECK (role IN ('rider', 'driver', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Driver profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS driver_profiles (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id),
        vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('auto', 'bike', 'car')),
        vehicle_number VARCHAR(50) NOT NULL,
        vehicle_model VARCHAR(100),
        license_number VARCHAR(50),
        rating DECIMAL(3,2) DEFAULT 5.0,
        total_rides INTEGER DEFAULT 0,
        is_available BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Rides table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rides (
        id VARCHAR(255) PRIMARY KEY,
        rider_id VARCHAR(255) REFERENCES users(id),
        driver_id VARCHAR(255) REFERENCES users(id),
        vehicle_type VARCHAR(20) NOT NULL,
        pickup_lat DECIMAL(10, 8) NOT NULL,
        pickup_lng DECIMAL(11, 8) NOT NULL,
        pickup_address TEXT NOT NULL,
        drop_lat DECIMAL(10, 8) NOT NULL,
        drop_lng DECIMAL(11, 8) NOT NULL,
        drop_address TEXT NOT NULL,
        distance INTEGER NOT NULL,
        fare DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
        payment_method VARCHAR(20),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);
    
    // Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(255) PRIMARY KEY,
        ride_id VARCHAR(255) REFERENCES rides(id),
        rider_id VARCHAR(255) REFERENCES users(id),
        driver_id VARCHAR(255) REFERENCES users(id),
        amount DECIMAL(10, 2) NOT NULL,
        method VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
        transaction_id VARCHAR(255) UNIQUE NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Payouts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payouts (
        id VARCHAR(255) PRIMARY KEY,
        driver_id VARCHAR(255) REFERENCES users(id),
        ride_id VARCHAR(255) REFERENCES rides(id),
        amount DECIMAL(10, 2) NOT NULL,
        platform_fee DECIMAL(10, 2) DEFAULT 0,
        net_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_rides_rider_id ON rides(rider_id);
      CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
      CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
      CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides(created_at);
      CREATE INDEX IF NOT EXISTS idx_transactions_ride_id ON transactions(ride_id);
      CREATE INDEX IF NOT EXISTS idx_payouts_driver_id ON payouts(driver_id);
    `);
    
    console.log('✅ Database schema created successfully');
    
  } catch (error) {
    console.error('❌ Schema creation error:', error);
    throw error;
  } finally {
    client.release();
  }
}
