/**
 * Fare Calculation Service - Google Cloud
 * Dynamic fare calculation with surge pricing using Google Cloud services
 */

import { Firestore } from '@google-cloud/firestore';
import { locationTrackingService } from './locationTrackingService';

interface LatLng {
  lat: number;
  lng: number;
}

interface RideDetails {
  pickup: LatLng & { address: string; city: string };
  drop: LatLng & { address: string };
  vehicleType: 'auto' | 'bike' | 'car';
  distance: number;
  estimatedTime: number;
}

interface VehiclePricing {
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
}

interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  surgeFare: number;
  taxes: number;
  platformFee: number;
  total: number;
  driverEarnings: number;
}

export type { FareBreakdown };

export class FareCalculationService {
  private firestore: Firestore;
  private pricingCache: Map<string, VehiclePricing> = new Map();
  
  constructor() {
    // Initialize Firestore for dynamic pricing configuration
    this.firestore = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'trusty-diorama-475905-c3',
    });
  }
  
  /**
   * Calculate fare for a ride
   */
  async calculateFare(ride: RideDetails): Promise<FareBreakdown> {
    // 1. Get pricing for vehicle type from Firestore
    const pricing = await this.getPricingFromFirestore(ride.vehicleType);
    
    // 2. Calculate base fare components
    const baseFare = pricing.baseFare;
    const distanceFare = ride.distance * pricing.perKmRate;
    const timeFare = ride.estimatedTime * pricing.perMinuteRate;
    
    // 3. Calculate dynamic surge from real-time demand
    const surgeMultiplier = await this.calculateSurgeFromDemand(ride.pickup);
    const surgeFare = (baseFare + distanceFare + timeFare) * (surgeMultiplier - 1);
    
    // 4. Calculate subtotal
    const subtotal = baseFare + distanceFare + timeFare + surgeFare;
    
    // 5. Apply minimum fare
    const adjustedSubtotal = Math.max(subtotal, pricing.minimumFare);
    
    // 6. Calculate taxes (18% GST in India, adjust based on region)
    const taxes = this.calculateTaxes(adjustedSubtotal);
    
    // 7. Platform fee (0% for zero-commission model)
    const platformFee = 0;
    
    // 8. Total fare
    const total = adjustedSubtotal + taxes + platformFee;
    
    // 9. Driver earnings (100% in zero-commission model)
    const driverEarnings = total - taxes - platformFee;
    
    return {
      baseFare,
      distanceFare,
      timeFare,
      surgeMultiplier,
      surgeFare,
      taxes,
      platformFee,
      total,
      driverEarnings
    };
  }
  
  /**
   * Get pricing configuration from Firestore
   * Allows for dynamic pricing updates without code deployment
   */
  private async getPricingFromFirestore(vehicleType: string): Promise<VehiclePricing> {
    // Check cache first
    if (this.pricingCache.has(vehicleType)) {
      return this.pricingCache.get(vehicleType)!;
    }
    
    try {
      const docRef = this.firestore.collection('pricing').doc(vehicleType);
      const doc = await docRef.get();
      
      if (doc.exists) {
        const pricing = doc.data() as VehiclePricing;
        this.pricingCache.set(vehicleType, pricing);
        return pricing;
      }
    } catch (error) {
      console.warn('Firestore pricing fetch failed, using defaults:', error);
    }
    
    // Fallback to default pricing
    return this.getDefaultPricing(vehicleType);
  }
  
  /**
   * Default pricing configuration
   */
  private getDefaultPricing(vehicleType: string): VehiclePricing {
    const pricingMap: Record<string, VehiclePricing> = {
      auto: {
        baseFare: 30,
        perKmRate: 12,
        perMinuteRate: 1.5,
        minimumFare: 50
      },
      bike: {
        baseFare: 20,
        perKmRate: 8,
        perMinuteRate: 1.0,
        minimumFare: 30
      },
      car: {
        baseFare: 50,
        perKmRate: 15,
        perMinuteRate: 2.0,
        minimumFare: 80
      }
    };
    
    const pricing = pricingMap[vehicleType] || pricingMap.car;
    this.pricingCache.set(vehicleType, pricing);
    return pricing;
  }
  
  /**
   * Calculate dynamic surge multiplier based on real-time demand
   * Uses Google Cloud services to analyze current supply and demand
   */
  private async calculateSurgeFromDemand(location: LatLng & { city: string }): Promise<number> {
    try {
      // 1. Get number of ride requests in last 10 minutes in the area
      const rideRequests = await this.getRideRequestsLast10Min(location);
      
      // 2. Get number of available drivers in the area
      const availableDrivers = await this.getAvailableDrivers(location);
      
      // 3. Calculate demand ratio
      const demandRatio = availableDrivers > 0 ? rideRequests / availableDrivers : 3;
      
      // 4. Apply surge algorithm
      let surgeMultiplier = 1.0;
      
      if (demandRatio > 3.0) {
        surgeMultiplier = 2.5; // Very high demand
      } else if (demandRatio > 2.5) {
        surgeMultiplier = 2.0; // High demand
      } else if (demandRatio > 2.0) {
        surgeMultiplier = 1.7; // Moderate-high demand
      } else if (demandRatio > 1.5) {
        surgeMultiplier = 1.3; // Moderate demand
      } else if (demandRatio > 1.2) {
        surgeMultiplier = 1.1; // Low demand
      }
      
      // 5. Time-based surge (peak hours)
      const hour = new Date().getHours();
      const isPeakHour = (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
      if (isPeakHour && surgeMultiplier < 1.2) {
        surgeMultiplier = 1.2; // Minimum surge during peak hours
      }
      
      return surgeMultiplier;
      
    } catch (error) {
      console.error('Surge calculation error:', error);
      return 1.0; // No surge on error
    }
  }
  
  /**
   * Get ride requests in last 10 minutes within 5km radius
   */
  private async getRideRequestsLast10Min(location: LatLng & { city: string }): Promise<number> {
    try {
      const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
      
      // Query Firestore for recent ride requests
      const snapshot = await this.firestore
        .collection('ride_requests')
        .where('city', '==', location.city)
        .where('timestamp', '>=', tenMinutesAgo)
        .where('status', 'in', ['pending', 'searching'])
        .get();
      
      return snapshot.size;
    } catch (error) {
      console.warn('Failed to get ride requests:', error);
      return 0;
    }
  }
  
  /**
   * Get available drivers in the area
   */
  private async getAvailableDrivers(location: LatLng & { city: string }): Promise<number> {
    try {
      const nearbyDrivers = await locationTrackingService.findNearbyDrivers(
        location,
        5 // 5km radius
      );
      return nearbyDrivers.length;
    } catch (error) {
      console.warn('Failed to get available drivers:', error);
      return 1; // Assume at least 1 driver to avoid division by zero
    }
  }
  
  /**
   * Calculate taxes based on regional requirements
   */
  private calculateTaxes(amount: number): number {
    // India GST: 18% (5% CGST + 5% SGST + 8% Service Tax)
    // Adjust based on your region
    const taxRate = 0.05; // 5% simplified for demo
    return amount * taxRate;
  }
  
  /**
   * Update pricing in Firestore (admin function)
   */
  async updatePricing(vehicleType: string, pricing: VehiclePricing): Promise<void> {
    try {
      await this.firestore
        .collection('pricing')
        .doc(vehicleType)
        .set(pricing);
      
      // Clear cache
      this.pricingCache.delete(vehicleType);
      
      console.log(`✅ Updated pricing for ${vehicleType}`);
    } catch (error) {
      console.error('Update pricing error:', error);
      throw error;
    }
  }
  
  /**
   * Get current surge multiplier for a location (for UI display)
   */
  async getCurrentSurge(location: LatLng & { city: string }): Promise<number> {
    return this.calculateSurgeFromDemand(location);
  }
  
  /**
   * Calculate refund amount (in case of cancellation)
   */
  calculateRefund(fare: FareBreakdown, cancellationReason: string): number {
    switch (cancellationReason) {
      case 'rider_cancelled_early':
        return 0; // No refund if cancelled early
      case 'rider_cancelled_late':
        return fare.total * 0.5; // 50% refund
      case 'driver_cancelled':
        return fare.total; // Full refund
      case 'system_error':
        return fare.total; // Full refund
      default:
        return 0;
    }
  }
}

// Export singleton instance
export const fareCalculationService = new FareCalculationService();
