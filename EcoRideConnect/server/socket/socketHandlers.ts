/**
 * SocketService using Socket.IO + Google Cloud Pub/Sub bridge
 * Receives socket events and publishes to Pub/Sub; subscribes to Pub/Sub and broadcasts to sockets
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { PubSub, Subscription } from '@google-cloud/pubsub';
import { matchingService } from '../services/matchingService';
import { locationTrackingService } from '../services/locationTrackingService';

interface RideRequest {
  id: string;
  riderId: string;
  pickup: any;
  drop: any;
  vehicleType: string;
  fare: number;
}

export class SocketService {
  private io: SocketIOServer;
  private pubsub: PubSub;
  private rideRequestSub?: Subscription;
  private locationSub?: Subscription;

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: { origin: '*' }
    });

    this.pubsub = new PubSub({ projectId: process.env.GOOGLE_CLOUD_PROJECT });

    this.setupSocketHandlers();
    this.setupPubSubListeners();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log('Socket connected:', socket.id);

      // For demo, accept a join message with user info
      socket.on('join', (payload: { userId: string; role: string }) => {
        const { userId, role } = payload || {};
        if (userId) {
          socket.join(`user:${userId}`);
        }
        if (role === 'driver') {
          socket.join('drivers');
          if (userId) socket.join(`driver:${userId}`);
        }
        if (role === 'admin') socket.join('admin-dashboard');
      });

      // Driver location updates -> publish to Pub/Sub
      socket.on('driver_location_update', async (data) => {
        try {
          await this.pubsub.topic(process.env.PUBSUB_LOCATION_TOPIC || 'driver-locations')
            .publishMessage({ data: Buffer.from(JSON.stringify(data)) });
        } catch (err) {
          console.warn('Failed to publish driver location to Pub/Sub:', err);
        }
      });

      // Ride request from rider -> publish to Pub/Sub
      socket.on('ride_request', async (data: RideRequest) => {
        try {
          await this.pubsub.topic(process.env.PUBSUB_RIDE_REQUESTS_TOPIC || 'ride-requests')
            .publishMessage({ data: Buffer.from(JSON.stringify(data)) });
        } catch (err) {
          console.warn('Failed to publish ride request to Pub/Sub:', err);
        }
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
      });
    });
  }

  private setupPubSubListeners() {
    // Ride requests subscription -> notify candidate drivers
    const rideSubName = process.env.PUBSUB_RIDE_REQUESTS_SUB || 'ride-requests-sub';
    try {
      this.rideRequestSub = this.pubsub.subscription(rideSubName);
      this.rideRequestSub.on('message', async (message) => {
        try {
          const ride: RideRequest = JSON.parse(message.data.toString());
          // Use matching service to find best drivers
          const candidates = await matchingService.findBestDriver(ride as any);
          // Notify candidate drivers via socket rooms
          candidates.forEach((d) => {
            this.io.to(`driver:${d.id}`).emit('ride_request', ride);
          });
          message.ack();
        } catch (err) {
          console.error('Failed to handle ride request message:', err);
          message.nack();
        }
      });
    } catch (err) {
      console.warn('Ride request subscription not available:', err);
    }

    // Location updates subscription -> broadcast to riders/admin
    const locSubName = process.env.PUBSUB_LOCATION_SUB || 'location-updates-sub';
    try {
      this.locationSub = this.pubsub.subscription(locSubName);
      this.locationSub.on('message', (message) => {
        try {
          const update = JSON.parse(message.data.toString());
          // Broadcast to city room
          if (update.city) this.io.to(`city:${update.city}`).emit('driver_location_changed', update);
          // Also broadcast to admin dashboard
          this.io.to('admin-dashboard').emit('driver_location_changed', update);
          message.ack();
        } catch (err) {
          console.error('Failed to handle location message:', err);
          message.nack();
        }
      });
    } catch (err) {
      console.warn('Location subscription not available:', err);
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    try {
      if (this.rideRequestSub) await this.rideRequestSub.close();
      if (this.locationSub) await this.locationSub.close();
      await this.io.close();
    } catch (err) {
      console.warn('Error during SocketService shutdown:', err);
    }
  }
}

export default SocketService;
