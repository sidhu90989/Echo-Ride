/**
 * Route Optimization Service - Google Maps APIs
 * Route optimization using Google Maps Directions and Distance Matrix APIs
 */

import { Client, DirectionsResponse, DistanceMatrixResponse, TravelMode } from '@googlemaps/google-maps-services-js';

interface LatLng {
  lat: number;
  lng: number;
}

interface Route {
  distance: number; // in meters
  duration: number; // in seconds
  durationInTraffic?: number; // in seconds
  polyline: string;
  steps: RouteStep[];
  bounds: {
    northeast: LatLng;
    southwest: LatLng;
  };
}

interface RouteStep {
  distance: number;
  duration: number;
  instruction: string;
  startLocation: LatLng;
  endLocation: LatLng;
}

interface ETAPrediction {
  baseETA: number; // seconds
  predictedETA: number; // seconds
  confidence: number; // 0-1
  trafficConditions?: string;
  alternativeRoutes?: number;
}

interface DriverBehavior {
  averageSpeed: number; // km/h
  brakingFrequency: number;
  accelerationPattern: string;
  historicalDelay: number; // average delay in seconds
}

export class RouteService {
  private mapsClient: Client;
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ Google Maps API key not configured');
    }
    
    this.mapsClient = new Client({});
  }
  
  /**
   * Calculate optimal route between two points
   * Uses Google Maps Directions API with traffic data
   */
  async calculateOptimalRoute(
    origin: LatLng,
    destination: LatLng,
    options?: {
      waypoints?: LatLng[];
      avoidTolls?: boolean;
      avoidHighways?: boolean;
    }
  ): Promise<Route> {
    try {
      const response = await this.mapsClient.directions({
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          mode: TravelMode.driving,
          alternatives: true, // Get alternative routes
          departure_time: new Date(), // For real-time traffic
          waypoints: options?.waypoints?.map(wp => `${wp.lat},${wp.lng}`),
          key: this.apiKey
        }
      });
      
      if (response.data.status !== 'OK' || !response.data.routes || response.data.routes.length === 0) {
        throw new Error(`Directions API error: ${response.data.status}`);
      }
      
      // Get the best route (first one is typically best by Google's algorithm)
      const bestRoute = response.data.routes[0];
      const leg = bestRoute.legs[0];
      
      return {
        distance: leg.distance.value,
        duration: leg.duration.value,
        durationInTraffic: leg.duration_in_traffic?.value,
        polyline: bestRoute.overview_polyline.points,
        steps: leg.steps.map(step => ({
          distance: step.distance.value,
          duration: step.duration.value,
          instruction: step.html_instructions,
          startLocation: {
            lat: step.start_location.lat,
            lng: step.start_location.lng
          },
          endLocation: {
            lat: step.end_location.lat,
            lng: step.end_location.lng
          }
        })),
        bounds: {
          northeast: {
            lat: bestRoute.bounds.northeast.lat,
            lng: bestRoute.bounds.northeast.lng
          },
          southwest: {
            lat: bestRoute.bounds.southwest.lat,
            lng: bestRoute.bounds.southwest.lng
          }
        }
      };
      
    } catch (error) {
      console.error('Calculate optimal route error:', error);
      throw error;
    }
  }
  
  /**
   * Get multiple route alternatives
   */
  async getAlternativeRoutes(
    origin: LatLng,
    destination: LatLng
  ): Promise<Route[]> {
    try {
      const response = await this.mapsClient.directions({
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          mode: TravelMode.driving,
          alternatives: true,
          departure_time: new Date(),
          key: this.apiKey
        }
      });
      
      if (response.data.status !== 'OK' || !response.data.routes) {
        throw new Error(`Directions API error: ${response.data.status}`);
      }
      
      return response.data.routes.map(route => {
        const leg = route.legs[0];
        return {
          distance: leg.distance.value,
          duration: leg.duration.value,
          durationInTraffic: leg.duration_in_traffic?.value,
          polyline: route.overview_polyline.points,
          steps: leg.steps.map(step => ({
            distance: step.distance.value,
            duration: step.duration.value,
            instruction: step.html_instructions,
            startLocation: {
              lat: step.start_location.lat,
              lng: step.start_location.lng
            },
            endLocation: {
              lat: step.end_location.lat,
              lng: step.end_location.lng
            }
          })),
          bounds: {
            northeast: {
              lat: route.bounds.northeast.lat,
              lng: route.bounds.northeast.lng
            },
            southwest: {
              lat: route.bounds.southwest.lat,
              lng: route.bounds.southwest.lng
            }
          }
        };
      });
      
    } catch (error) {
      console.error('Get alternative routes error:', error);
      throw error;
    }
  }
  
  /**
   * Predict accurate ETA using Distance Matrix API
   * Accounts for real-time traffic and driver behavior
   */
  async predictETA(
    origin: LatLng,
    destination: LatLng,
    driverBehavior?: DriverBehavior
  ): Promise<ETAPrediction> {
    try {
      const response = await this.mapsClient.distancematrix({
        params: {
          origins: [`${origin.lat},${origin.lng}`],
          destinations: [`${destination.lat},${destination.lng}`],
          mode: TravelMode.driving,
          departure_time: new Date(),
          key: this.apiKey
        }
      });
      
      if (response.data.status !== 'OK' || !response.data.rows || response.data.rows.length === 0) {
        throw new Error(`Distance Matrix API error: ${response.data.status}`);
      }
      
      const element = response.data.rows[0].elements[0];
      
      if (element.status !== 'OK') {
        throw new Error(`Distance Matrix element error: ${element.status}`);
      }
      
      const baseETA = element.duration.value;
      const trafficETA = element.duration_in_traffic?.value || baseETA;
      
      // Adjust ETA based on driver behavior if available
      let predictedETA = trafficETA;
      if (driverBehavior) {
        const adjustment = this.calculateSpeedAdjustment(trafficETA, driverBehavior);
        predictedETA = trafficETA + adjustment;
      }
      
      // Calculate confidence based on traffic data availability
      const confidence = element.duration_in_traffic ? 0.85 : 0.70;
      
      return {
        baseETA,
        predictedETA,
        confidence,
        trafficConditions: this.interpretTrafficDelay(baseETA, trafficETA),
        alternativeRoutes: 0 // Could fetch alternative routes count
      };
      
    } catch (error) {
      console.error('Predict ETA error:', error);
      throw error;
    }
  }
  
  /**
   * Calculate batch ETAs for multiple destinations
   * Useful for finding nearest driver among multiple options
   */
  async calculateBatchETAs(
    origin: LatLng,
    destinations: LatLng[]
  ): Promise<Map<string, ETAPrediction>> {
    try {
      const response = await this.mapsClient.distancematrix({
        params: {
          origins: [`${origin.lat},${origin.lng}`],
          destinations: destinations.map(d => `${d.lat},${d.lng}`),
          mode: TravelMode.driving,
          departure_time: new Date(),
          key: this.apiKey
        }
      });
      
      if (response.data.status !== 'OK' || !response.data.rows) {
        throw new Error(`Distance Matrix API error: ${response.data.status}`);
      }
      
      const results = new Map<string, ETAPrediction>();
      const elements = response.data.rows[0].elements;
      
      elements.forEach((element, index) => {
        if (element.status === 'OK') {
          const dest = destinations[index];
          const key = `${dest.lat},${dest.lng}`;
          
          const baseETA = element.duration.value;
          const trafficETA = element.duration_in_traffic?.value || baseETA;
          
          results.set(key, {
            baseETA,
            predictedETA: trafficETA,
            confidence: element.duration_in_traffic ? 0.85 : 0.70,
            trafficConditions: this.interpretTrafficDelay(baseETA, trafficETA)
          });
        }
      });
      
      return results;
      
    } catch (error) {
      console.error('Calculate batch ETAs error:', error);
      throw error;
    }
  }
  
  /**
   * Calculate speed adjustment based on driver behavior
   */
  private calculateSpeedAdjustment(baseETA: number, behavior: DriverBehavior): number {
    // If driver typically drives faster, reduce ETA
    // If driver typically drives slower, increase ETA
    
    const averageSpeed = 30; // km/h default city speed
    const speedRatio = behavior.averageSpeed / averageSpeed;
    
    // Adjust ETA based on speed ratio
    let adjustment = baseETA * (1 - speedRatio);
    
    // Add historical delay
    adjustment += behavior.historicalDelay;
    
    // Cap adjustment to ±30% of base ETA
    const maxAdjustment = baseETA * 0.3;
    adjustment = Math.max(-maxAdjustment, Math.min(maxAdjustment, adjustment));
    
    return adjustment;
  }
  
  /**
   * Interpret traffic delay severity
   */
  private interpretTrafficDelay(baseETA: number, trafficETA: number): string {
    const delayRatio = trafficETA / baseETA;
    
    if (delayRatio >= 1.5) return 'Heavy traffic';
    if (delayRatio >= 1.2) return 'Moderate traffic';
    if (delayRatio >= 1.1) return 'Light traffic';
    return 'Clear roads';
  }
  
  /**
   * Calculate distance between two points
   */
  async calculateDistance(origin: LatLng, destination: LatLng): Promise<number> {
    try {
      const response = await this.mapsClient.distancematrix({
        params: {
          origins: [`${origin.lat},${origin.lng}`],
          destinations: [`${destination.lat},${destination.lng}`],
          mode: TravelMode.driving,
          key: this.apiKey
        }
      });
      
      if (response.data.status === 'OK' && response.data.rows && response.data.rows.length > 0) {
        const element = response.data.rows[0].elements[0];
        if (element.status === 'OK') {
          return element.distance.value; // meters
        }
      }
      
      throw new Error('Failed to calculate distance');
    } catch (error) {
      console.error('Calculate distance error:', error);
      throw error;
    }
  }
  
  /**
   * Geocode address to coordinates
   */
  async geocodeAddress(address: string): Promise<LatLng> {
    try {
      const response = await this.mapsClient.geocode({
        params: {
          address,
          key: this.apiKey
        }
      });
      
      if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng
        };
      }
      
      throw new Error(`Geocoding failed: ${response.data.status}`);
    } catch (error) {
      console.error('Geocode address error:', error);
      throw error;
    }
  }
  
  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(location: LatLng): Promise<string> {
    try {
      const response = await this.mapsClient.reverseGeocode({
        params: {
          latlng: `${location.lat},${location.lng}`,
          key: this.apiKey
        }
      });
      
      if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
        return response.data.results[0].formatted_address;
      }
      
      throw new Error(`Reverse geocoding failed: ${response.data.status}`);
    } catch (error) {
      console.error('Reverse geocode error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const routeService = new RouteService();
