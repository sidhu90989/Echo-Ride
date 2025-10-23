/**
 * Google Cloud Database configuration
 * - Cloud SQL (Postgres) via pg Pool
 * - Firestore
 * - Optional Redis client wrapper for Memorystore
 */

import { Pool } from 'pg';
import { Firestore } from '@google-cloud/firestore';
import Redis from 'ioredis';

// Cloud SQL (Postgres) pool
export const pgPool = new Pool({
  host: process.env.CLOUD_SQL_HOST || '127.0.0.1',
  port: parseInt(process.env.CLOUD_SQL_PORT || '5432', 10),
  user: process.env.CLOUD_SQL_USER || 'ecoride-user',
  password: process.env.CLOUD_SQL_PASSWORD || 'password',
  database: process.env.CLOUD_SQL_DATABASE || 'ecoride',
  // In GCP you'd normally use the Cloud SQL Proxy or private IP
});

// Firestore for flexible real-time data
export const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
});

// Redis client for Memorystore
let redisClient: Redis | null = null;
export function getRedisClient(): Redis {
  if (redisClient && redisClient.status === 'ready') return redisClient;

  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);

  redisClient = new Redis({
    host,
    port,
    // increase timeouts for cloud
    connectTimeout: 10000,
    lazyConnect: true,
  });

  // Attempt connect but don't throw — callers should handle failures
  redisClient.connect().catch((err) => {
    console.warn('Redis connect error (non-fatal):', err.message || err);
  });

  return redisClient;
}

export default {
  pgPool,
  firestore,
  getRedisClient,
};
