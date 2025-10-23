/**
 * Location Tracking Service - Google Cloud Only
 * Real-time GPS tracking using Google Cloud Pub/Sub and Memorystore (Redis)
 */

import { PubSub, Topic } from '@google-cloud/pubsub';
import Redis from 'ioredis';

interface LocationUpdate {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  city: string;
  timestamp: number;
}

interface LatLng {
  lat: number;
  lng: number;
}

interface NearbyDriver {
  driverId: string;
  distance: number;
  location: LatLng;
}

export class LocationTrackingService {
  private pubsub: PubSub;
  private locationTopic: Topic;
  private redisClient: Redis | null = null;
  
  constructor() {
    // Initialize Google Cloud Pub/Sub
    this.pubsub = new PubSub({
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'trusty-diorama-475905-c3',
    });
    
    // Get or create location topic
    this.locationTopic = this.pubsub.topic(
      process.env.PUBSUB_LOCATION_TOPIC || 'driver-locations'
    );
  }
  
  /**
   * Initialize Redis connection to Google Cloud Memorystore
   */
  private async getRedisClient(): Promise<Redis> {
    if (this.redisClient && this.redisClient.status === 'ready') {
      return this.redisClient;
    }
    
    // For local development, use local Redis
    // For production, use Google Cloud Memorystore
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');
    
    this.redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      // Handle connection errors gracefully
      lazyConnect: true,
    });
    
    try {
      await this.redisClient.connect();
      console.log('✅ Connected to Redis (Memorystore)');
    } catch (error) {
      console.warn('⚠️ Redis connection failed, using in-memory fallback:', error);
      // Don't throw - allow the service to work without Redis
    }
    
    return this.redisClient;
  }
  
  /**
   * Validate GPS location data
   */
  private validateLocation(update: LocationUpdate): LocationUpdate {
    // Validate latitude (-90 to 90)
    if (update.lat < -90 || update.lat > 90) {
      throw new Error(`Invalid latitude: ${update.lat}`);
    }
    
    // Validate longitude (-180 to 180)
    if (update.lng < -180 || update.lng > 180) {
      throw new Error(`Invalid longitude: ${update.lng}`);
    }
    
    // Validate speed (if provided, must be >= 0)
    if (update.speed !== undefined && update.speed < 0) {
      throw new Error(`Invalid speed: ${update.speed}`);
    }
    
    // Validate heading (if provided, must be 0-360)
    if (update.heading !== undefined && (update.heading < 0 || update.heading > 360)) {
      throw new Error(`Invalid heading: ${update.heading}`);
    }
    
    return update;
  }
  
  /**
   * Process driver location update
   * 1. Validate GPS data
   * 2. Publish to Pub/Sub for processing
   * 3. Update Memorystore (Redis) for geospatial queries
   * 4. Set expiry for offline detection
   */
  async processDriverLocation(update: LocationUpdate): Promise<void> {
    try {
      // 1. Validate GPS data
      const validated = this.validateLocation(update);
      
      // 2. Publish to Pub/Sub topic for other services
      try {
        const messageBuffer = Buffer.from(JSON.stringify(validated));
        await this.locationTopic.publishMessage({ data: messageBuffer });
      } catch (pubsubError) {
        console.warn('Pub/Sub publish failed, continuing:', pubsubError);
      }
      
      // 3. Update Memorystore (Redis) with geospatial data
      try {
        const redisClient = await this.getRedisClient();
        const geoKey = `drivers:active:${validated.city}`;
        
        // Add driver location to geospatial index
        await redisClient.geoadd(
          geoKey,
          validated.lng,
          validated.lat,
          validated.driverId
        );
        
        // Store additional driver metadata
        await redisClient.hset(
          `driver:${validated.driverId}:metadata`,
          'lat', validated.lat.toString(),
          'lng', validated.lng.toString(),
          'heading', (validated.heading || 0).toString(),
          'speed', (validated.speed || 0).toString(),
          'lastUpdate', validated.timestamp.toString()
        );
        
        // 4. Set expiry for offline detection (15 seconds)
        await redisClient.expire(`driver:${validated.driverId}:metadata`, 15);
        await redisClient.expire(geoKey, 15);
        
      } catch (redisError) {
        console.warn('Redis operation failed:', redisError);
      }
      
    } catch (error) {
      console.error('Location processing error:', error);
      throw error;
    }
  }
  
  /**
   * Find nearby drivers using Memorystore GEOSEARCH
   * @param center Center location to search from
   * @param radiusKm Search radius in kilometers
   * @param vehicleType Optional filter by vehicle type
   * @returns Array of nearby drivers with distances
   */
  async findNearbyDrivers(
    center: LatLng & { city: string },
    radiusKm: number = 5,
    vehicleType?: string
  ): Promise<NearbyDriver[]> {
    try {
      const redisClient = await this.getRedisClient();
      const geoKey = `drivers:active:${center.city}`;
      
      // Use GEORADIUS to find drivers within radius
      const results = await redisClient.georadius(
        geoKey,
        center.lng,
        center.lat,
        radiusKm,
        'km',
        'WITHDIST',
        'WITHCOORD',
        'ASC' // Sort by distance, closest first
      );
      
      // Transform results to NearbyDriver format
      const nearbyDrivers: NearbyDriver[] = results.map((result: any) => {
        const [driverId, distance, [lng, lat]] = result;
        return {
          driverId,
          distance: parseFloat(distance),
          location: {
            lat: parseFloat(lat),
            lng: parseFloat(lng)
          }
        };
      });
      
      // Filter by vehicle type if specified
      if (vehicleType) {
        const filtered = [];
        for (const driver of nearbyDrivers) {
          const metadata = await redisClient.hgetall(`driver:${driver.driverId}:metadata`);
          if (metadata.vehicleType === vehicleType) {
            filtered.push(driver);
          }
        }
        return filtered;
      }
      
      return nearbyDrivers;
      
    } catch (error) {
      console.error('Find nearby drivers error:', error);
      return [];
    }
  }
  
  /**
   * Get driver's current location from cache
   */
  async getDriverLocation(driverId: string): Promise<LocationUpdate | null> {
    try {
      const redisClient = await this.getRedisClient();
      const metadata = await redisClient.hgetall(`driver:${driverId}:metadata`);
      
      if (!metadata || !metadata.lat) {
        return null;
      }
      
      return {
        driverId,
        lat: parseFloat(metadata.lat),
        lng: parseFloat(metadata.lng),
        heading: parseFloat(metadata.heading || '0'),
        speed: parseFloat(metadata.speed || '0'),
        city: metadata.city || 'unknown',
        timestamp: parseInt(metadata.lastUpdate || '0')
      };
      
    } catch (error) {
      console.error('Get driver location error:', error);
      return null;
    }
  }
  
  /**
   * Check if driver is online (has recent location update)
   */
  async isDriverOnline(driverId: string): Promise<boolean> {
    try {
      const redisClient = await this.getRedisClient();
      const exists = await redisClient.exists(`driver:${driverId}:metadata`);
      return exists === 1;
    } catch (error) {
      console.error('Check driver online error:', error);
      return false;
    }
  }
  
  /**
   * Remove driver from active tracking (when going offline)
   */
  async removeDriver(driverId: string, city: string): Promise<void> {
    try {
      const redisClient = await this.getRedisClient();
      
      // Remove from geospatial index
      await redisClient.zrem(`drivers:active:${city}`, driverId);
      
      // Remove metadata
      await redisClient.del(`driver:${driverId}:metadata`);
      
    } catch (error) {
      console.error('Remove driver error:', error);
    }
  }
  
  /**
   * Subscribe to location updates from Pub/Sub
   * @param callback Function to call when location update received
   */
  subscribeToLocationUpdates(callback: (update: LocationUpdate) => void): () => void {
    const subscriptionName = 'location-updates-sub';
    const subscription = this.pubsub.subscription(subscriptionName);
    
    const messageHandler = (message: any) => {
      try {
        const update: LocationUpdate = JSON.parse(message.data.toString());
        callback(update);
        message.ack();
      } catch (error) {
        console.error('Location update parse error:', error);
        message.nack();
      }
    };
    
    subscription.on('message', messageHandler);
    subscription.on('error', (error) => {
      console.error('Pub/Sub subscription error:', error);
    });
    
    // Return cleanup function
    return () => {
      subscription.removeListener('message', messageHandler);
    };
  }
  
  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
    }
  }
}

// Export singleton instance
export const locationTrackingService = new LocationTrackingService();
