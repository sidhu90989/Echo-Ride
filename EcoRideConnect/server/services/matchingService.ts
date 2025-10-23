/**
 * Driver-Rider Matching Service - Google Cloud AI
 * Intelligent matching using Google Cloud Vertex AI and BigQuery
 */

import { BigQuery } from '@google-cloud/bigquery';
import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { locationTrackingService } from './locationTrackingService';

interface RideRequest {
  id: string;
  riderId: string;
  pickup: {
    lat: number;
    lng: number;
    address: string;
    city: string;
  };
  drop: {
    lat: number;
    lng: number;
    address: string;
  };
  vehicleType: 'auto' | 'bike' | 'car';
  fare: number;
  distance: number;
  estimatedTime: number;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  rating: number;
  location: {
    lat: number;
    lng: number;
  };
  distance?: number;
}

interface MLFeatures {
  driverId: string;
  distance: number;
  avgRating: number;
  totalRides: number;
  acceptanceRate: number;
  vehicleType: string;
  currentSpeed: number;
  timeOfDay: number;
  dayOfWeek: number;
  surgeArea: boolean;
}

interface DriverPrediction extends Driver {
  mlScore: number;
  estimatedArrival: number;
}

export class MatchingService {
  private bigquery: BigQuery;
  private aiPlatformClient: PredictionServiceClient | null = null;
  
  constructor() {
    // Initialize BigQuery
    this.bigquery = new BigQuery({
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'trusty-diorama-475905-c3',
    });
    
    // Initialize AI Platform (optional - graceful fallback if not configured)
    try {
      this.aiPlatformClient = new PredictionServiceClient();
    } catch (error) {
      console.warn('⚠️ Vertex AI not configured, using simple matching algorithm');
    }
  }
  
  /**
   * Find best driver for ride request
   * Uses Google Cloud AI for intelligent matching when available
   */
  async findBestDriver(rideRequest: RideRequest): Promise<DriverPrediction[]> {
    try {
      // 1. Get nearby drivers from Memorystore
      const nearbyDrivers = await locationTrackingService.findNearbyDrivers(
        {
          lat: rideRequest.pickup.lat,
          lng: rideRequest.pickup.lng,
          city: rideRequest.pickup.city
        },
        5, // 5km radius
        rideRequest.vehicleType
      );
      
      if (nearbyDrivers.length === 0) {
        console.log('No nearby drivers found');
        return [];
      }
      
      // 2. Get driver details from database
      const drivers = await this.getDriverDetails(nearbyDrivers.map(d => d.driverId));
      
      // Combine location data with driver details
      const driversWithDistance = drivers.map(driver => {
        const nearby = nearbyDrivers.find(d => d.driverId === driver.id);
        return {
          ...driver,
          distance: nearby?.distance || 0,
          location: nearby?.location || driver.location
        };
      });
      
      // 3. Try ML-based matching if Vertex AI is available
      if (this.aiPlatformClient && process.env.VERTEX_AI_ENDPOINT) {
        try {
          const predictions = await this.mlBasedMatching(driversWithDistance, rideRequest);
          return predictions;
        } catch (mlError) {
          console.warn('ML matching failed, using simple algorithm:', mlError);
        }
      }
      
      // 4. Fallback to simple rule-based matching
      return this.simpleMatching(driversWithDistance, rideRequest);
      
    } catch (error) {
      console.error('Find best driver error:', error);
      return [];
    }
  }
  
  /**
   * ML-based matching using Google Cloud Vertex AI
   */
  private async mlBasedMatching(
    drivers: Driver[],
    rideRequest: RideRequest
  ): Promise<DriverPrediction[]> {
    // 1. Prepare features for ML model
    const features = await this.prepareMLFeatures(drivers, rideRequest);
    
    // 2. Get predictions from Vertex AI
    const predictions = await this.vertexAIPredict(features);
    
    // 3. Combine predictions with driver data
    const driversWithScores: DriverPrediction[] = drivers.map((driver, index) => {
      const prediction = predictions[index] || { score: 0 };
      return {
        ...driver,
        mlScore: prediction.score || 0,
        estimatedArrival: this.calculateETA(driver.distance || 0, driver.location)
      };
    });
    
    // 4. Sort by ML score and return top 3
    return driversWithScores
      .sort((a, b) => b.mlScore - a.mlScore)
      .slice(0, 3);
  }
  
  /**
   * Simple rule-based matching (fallback)
   * Scoring based on: distance (40%), rating (30%), acceptance rate (30%)
   */
  private async simpleMatching(
    drivers: Driver[],
    rideRequest: RideRequest
  ): Promise<DriverPrediction[]> {
    // Get historical data from BigQuery if available
    let historicalData: Map<string, any> = new Map();
    try {
      const historical = await this.getHistoricalData(drivers.map(d => d.id));
      historicalData = new Map(historical.map(h => [h.driver_id, h]));
    } catch (error) {
      console.warn('BigQuery query failed, using basic scoring:', error);
    }
    
    const driversWithScores: DriverPrediction[] = drivers.map(driver => {
      const history = historicalData.get(driver.id) || {
        avg_rating: driver.rating,
        acceptance_rate: 0.8,
        total_rides: 0
      };
      
      // Calculate normalized scores (0-1)
      const distanceScore = Math.max(0, 1 - (driver.distance || 0) / 10); // Normalize to 10km max
      const ratingScore = history.avg_rating / 5; // Normalize to 5-star max
      const acceptanceScore = history.acceptance_rate;
      const experienceScore = Math.min(history.total_rides / 100, 1); // Cap at 100 rides
      
      // Weighted average
      const mlScore = (
        distanceScore * 0.40 +
        ratingScore * 0.25 +
        acceptanceScore * 0.25 +
        experienceScore * 0.10
      );
      
      return {
        ...driver,
        mlScore,
        estimatedArrival: this.calculateETA(driver.distance || 0, driver.location)
      };
    });
    
    return driversWithScores
      .sort((a, b) => b.mlScore - a.mlScore)
      .slice(0, 3);
  }
  
  /**
   * Prepare features for ML model
   */
  private async prepareMLFeatures(
    drivers: Driver[],
    rideRequest: RideRequest
  ): Promise<MLFeatures[]> {
    // Get historical data from BigQuery
    const historical = await this.getHistoricalData(drivers.map(d => d.id));
    const historicalMap = new Map(historical.map(h => [h.driver_id, h]));
    
    const now = new Date();
    const timeOfDay = now.getHours() + now.getMinutes() / 60; // 0-24
    const dayOfWeek = now.getDay(); // 0-6
    
    return drivers.map(driver => {
      const history = historicalMap.get(driver.id) || {
        avg_rating: driver.rating,
        total_rides: 0,
        acceptance_rate: 0.8
      };
      
      return {
        driverId: driver.id,
        distance: driver.distance || 0,
        avgRating: history.avg_rating,
        totalRides: history.total_rides,
        acceptanceRate: history.acceptance_rate,
        vehicleType: driver.vehicleType,
        currentSpeed: 0, // Could get from location metadata
        timeOfDay,
        dayOfWeek,
        surgeArea: false // Could calculate based on current demand
      };
    });
  }
  
  /**
   * Get predictions from Google Cloud Vertex AI
   */
  private async vertexAIPredict(features: MLFeatures[]): Promise<any[]> {
    if (!this.aiPlatformClient || !process.env.VERTEX_AI_ENDPOINT) {
      throw new Error('Vertex AI not configured');
    }
    
    // Simplified prediction - in production, properly format according to your model
    // For now, return mock predictions
    console.warn('⚠️ Vertex AI prediction not fully implemented, using mock data');
    
    return features.map(f => ({
      score: f.avgRating / 5 * 0.5 + (1 - f.distance / 10) * 0.5
    }));
  }
  
  /**
   * Get historical data from BigQuery
   */
  private async getHistoricalData(driverIds: string[]): Promise<any[]> {
    if (driverIds.length === 0) return [];
    
    const datasetId = process.env.BIGQUERY_DATASET || 'ecoride_analytics';
    const tableId = 'ride_history';
    
    const query = `
      SELECT 
        driver_id,
        AVG(rating) as avg_rating,
        COUNT(*) as total_rides,
        AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as acceptance_rate,
        AVG(trip_duration_minutes) as avg_trip_duration
      FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${datasetId}.${tableId}\`
      WHERE driver_id IN (${driverIds.map(id => `'${id}'`).join(',')})
        AND created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
      GROUP BY driver_id
    `;
    
    try {
      const [rows] = await this.bigquery.query({ query });
      return rows;
    } catch (error) {
      console.error('BigQuery query error:', error);
      return [];
    }
  }
  
  /**
   * Get driver details from database (mock - would query actual DB)
   */
  private async getDriverDetails(driverIds: string[]): Promise<Driver[]> {
    // In production, this would query Cloud SQL or Firestore
    // For now, return mock data
    return driverIds.map(id => ({
      id,
      name: `Driver ${id.substring(0, 8)}`,
      phone: '+1234567890',
      vehicleType: 'car',
      vehicleNumber: 'ABC-123',
      rating: 4.5,
      location: { lat: 0, lng: 0 }
    }));
  }
  
  /**
   * Calculate estimated arrival time
   */
  private calculateETA(distance: number, location: { lat: number; lng: number }): number {
    // Simple calculation: distance / average speed
    const averageSpeedKmh = 30; // Average city driving speed
    const timeMinutes = (distance / averageSpeedKmh) * 60;
    return Math.ceil(timeMinutes);
  }
  
  /**
   * Assign ride to best driver
   */
  async assignRide(rideId: string, driverId: string): Promise<boolean> {
    // In production, update Cloud SQL and publish to Pub/Sub
    console.log(`Ride ${rideId} assigned to driver ${driverId}`);
    return true;
  }
}

// Export singleton instance
export const matchingService = new MatchingService();
