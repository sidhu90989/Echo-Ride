/**
 * Payment Service - Google Cloud
 * Payment processing using Google Pay API and Cloud SQL
 * Supports: Google Pay, Cash, and Wallet payments
 */

import { Firestore } from '@google-cloud/firestore';
import { fareCalculationService, type FareBreakdown } from './fareCalculationService';
import { pgPool } from '../config/database';

interface PaymentMethod {
  type: 'GOOGLE_PAY' | 'CASH' | 'WALLET' | 'UPI';
  id?: string;
  token?: string;
  upiId?: string;
}

interface GooglePayMethod extends PaymentMethod {
  type: 'GOOGLE_PAY';
  token: string;
  email?: string;
}

interface WalletMethod extends PaymentMethod {
  type: 'WALLET';
  walletId: string;
}

interface Ride {
  id: string;
  riderId: string;
  driverId: string;
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
  distance: number;
  fare: number;
  status: string;
}

interface PaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  method: string;
  timestamp: Date;
  error?: string;
}

interface Transaction {
  id: string;
  rideId: string;
  riderId: string;
  driverId: string;
  amount: number;
  method: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionId: string;
  timestamp: Date;
  metadata?: any;
}

interface Payout {
  id: string;
  driverId: string;
  rideId: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  timestamp: Date;
}

interface Wallet {
  userId: string;
  balance: number;
  currency: string;
  lastUpdated: Date;
}

export class PaymentService {
  private firestore: Firestore;
  
  constructor() {
    // Initialize Firestore for payment data
    this.firestore = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'trusty-diorama-475905-c3',
    });
  }
  
  /**
   * Process ride payment
   * Main entry point for all payment types
   */
  async processRidePayment(
    ride: Ride,
    paymentMethod: PaymentMethod
  ): Promise<PaymentResult> {
    try {
      // Calculate final fare
      const fareBreakdown = await fareCalculationService.calculateFare({
        pickup: ride.pickup,
        drop: ride.drop,
        vehicleType: ride.vehicleType,
        distance: ride.distance,
        estimatedTime: Math.ceil(ride.distance / 30 * 60) // Rough estimate
      });
      
      // Process based on payment method
      switch (paymentMethod.type) {
        case 'GOOGLE_PAY':
          return await this.processGooglePay(ride, fareBreakdown, paymentMethod as GooglePayMethod);
        
        case 'CASH':
          return await this.processCashPayment(ride, fareBreakdown);
        
        case 'WALLET':
          return await this.processWalletPayment(ride, fareBreakdown, paymentMethod as WalletMethod);
        
        case 'UPI':
          return await this.processUPIPayment(ride, fareBreakdown, paymentMethod);
        
        default:
          throw new Error(`Unsupported payment method: ${paymentMethod.type}`);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      await this.logPaymentFailure(ride, error as Error);
      throw error;
    }
  }
  
  /**
   * Process Google Pay payment
   * For production: integrate with Google Pay API
   * https://developers.google.com/pay/api
   */
  private async processGooglePay(
    ride: Ride,
    fare: FareBreakdown,
    method: GooglePayMethod
  ): Promise<PaymentResult> {
    try {
      // In production, verify Google Pay token with Google Pay API
      // For demo, simulate successful payment
      
      const transactionId = this.generateTransactionId();
      
      // Store transaction in Firestore
      const transaction: Transaction = {
        id: transactionId,
        rideId: ride.id,
        riderId: ride.riderId,
        driverId: ride.driverId,
        amount: fare.total,
        method: 'GOOGLE_PAY',
        status: 'COMPLETED',
        transactionId,
        timestamp: new Date(),
        metadata: {
          token: method.token.substring(0, 20) + '...', // Truncate for security
          email: method.email
        }
      };
      
      await this.firestore.collection('transactions').doc(transactionId).set(transaction);
      try {
        await pgPool.query(
          `INSERT INTO transactions(id, ride_id, rider_id, driver_id, amount, method, status, transaction_id, metadata, created_at)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [transaction.id, transaction.rideId, transaction.riderId, transaction.driverId, transaction.amount, transaction.method, transaction.status, transaction.transactionId, JSON.stringify(transaction.metadata || {}), transaction.timestamp]
        );
      } catch (sqlErr) {
        console.warn('Cloud SQL insert transaction failed (non-fatal):', String(sqlErr));
      }
      try {
        await pgPool.query(
          `INSERT INTO transactions(id, ride_id, rider_id, driver_id, amount, method, status, transaction_id, metadata, created_at)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [transaction.id, transaction.rideId, transaction.riderId, transaction.driverId, transaction.amount, transaction.method, transaction.status, transaction.transactionId, JSON.stringify(transaction.metadata || {}), transaction.timestamp]
        );
      } catch (sqlErr) {
        console.warn('Cloud SQL insert transaction failed (non-fatal):', String(sqlErr));
      }
      try {
        await pgPool.query(
          `INSERT INTO transactions(id, ride_id, rider_id, driver_id, amount, method, status, transaction_id, metadata, created_at)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [transaction.id, transaction.rideId, transaction.riderId, transaction.driverId, transaction.amount, transaction.method, transaction.status, transaction.transactionId, JSON.stringify(transaction.metadata || {}), transaction.timestamp]
        );
      } catch (sqlErr) {
        console.warn('Cloud SQL insert transaction failed (non-fatal):', String(sqlErr));
      }

      // Also write to Cloud SQL transactions table when available
      try {
        await pgPool.query(
          `INSERT INTO transactions(id, ride_id, rider_id, driver_id, amount, method, status, transaction_id, metadata, created_at)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [transaction.id, transaction.rideId, transaction.riderId, transaction.driverId, transaction.amount, transaction.method, transaction.status, transaction.transactionId, JSON.stringify(transaction.metadata || {}), transaction.timestamp]
        );
      } catch (sqlErr) {
        console.warn('Cloud SQL insert transaction failed (non-fatal):', String(sqlErr));
      }
      
      // Calculate driver payout (100% in zero-commission model)
      const payout: Payout = {
        id: this.generatePayoutId(),
        driverId: ride.driverId,
        rideId: ride.id,
        amount: fare.total,
        platformFee: 0, // Zero commission
        netAmount: fare.driverEarnings,
        status: 'COMPLETED',
        timestamp: new Date()
      };
      
      await this.firestore.collection('payouts').doc(payout.id).set(payout);
      try {
        await pgPool.query(
          `INSERT INTO payouts(id, driver_id, ride_id, amount, platform_fee, net_amount, status, created_at)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
          [payout.id, payout.driverId, payout.rideId, payout.amount, payout.platformFee, payout.netAmount, payout.status, payout.timestamp]
        );
      } catch (sqlErr) {
        console.warn('Cloud SQL insert payout failed (non-fatal):', String(sqlErr));
      }
      try {
        await pgPool.query(
          `INSERT INTO payouts(id, driver_id, ride_id, amount, platform_fee, net_amount, status, created_at)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
          [payout.id, payout.driverId, payout.rideId, payout.amount, payout.platformFee, payout.netAmount, payout.status, payout.timestamp]
        );
      } catch (sqlErr) {
        console.warn('Cloud SQL insert payout failed (non-fatal):', String(sqlErr));
      }

        // Also insert payout into Cloud SQL when available
        try {
          await pgPool.query(
            `INSERT INTO payouts(id, driver_id, ride_id, amount, platform_fee, net_amount, status, created_at)
             VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
            [payout.id, payout.driverId, payout.rideId, payout.amount, payout.platformFee, payout.netAmount, payout.status, payout.timestamp]
          );
        } catch (sqlErr) {
          console.warn('Cloud SQL insert payout failed (non-fatal):', String(sqlErr));
        }
      
      // Update driver wallet (add earnings)
      await this.addToWallet(ride.driverId, fare.driverEarnings);
      
      console.log(`✅ Google Pay payment processed: ₹${fare.total} for ride ${ride.id}`);
      
      return {
        success: true,
        transactionId,
        amount: fare.total,
        method: 'GOOGLE_PAY',
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Google Pay processing error:', error);
      return {
        success: false,
        transactionId: '',
        amount: 0,
        method: 'GOOGLE_PAY',
        timestamp: new Date(),
        error: (error as Error).message
      };
    }
  }
  
  /**
   * Process cash payment
   * Cash is collected by driver, just record the transaction
   */
  private async processCashPayment(
    ride: Ride,
    fare: FareBreakdown
  ): Promise<PaymentResult> {
    try {
      const transactionId = this.generateTransactionId();
      
      // Record cash transaction
      const transaction: Transaction = {
        id: transactionId,
        rideId: ride.id,
        riderId: ride.riderId,
        driverId: ride.driverId,
        amount: fare.total,
        method: 'CASH',
        status: 'COMPLETED',
        transactionId,
        timestamp: new Date(),
        metadata: {
          collectedBy: 'DRIVER',
          note: 'Cash collected at destination'
        }
      };
      
      await this.firestore.collection('transactions').doc(transactionId).set(transaction);
      
      // Driver payout (cash already received)
      const payout: Payout = {
        id: this.generatePayoutId(),
        driverId: ride.driverId,
        rideId: ride.id,
        amount: fare.total,
        platformFee: 0,
        netAmount: fare.driverEarnings,
        status: 'COMPLETED',
        timestamp: new Date()
      };
      
      await this.firestore.collection('payouts').doc(payout.id).set(payout);
      
      console.log(`✅ Cash payment recorded: ₹${fare.total} for ride ${ride.id}`);
      
      return {
        success: true,
        transactionId,
        amount: fare.total,
        method: 'CASH',
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Cash payment recording error:', error);
      throw error;
    }
  }
  
  /**
   * Process wallet payment
   * Deduct from rider wallet, add to driver wallet
   */
  private async processWalletPayment(
    ride: Ride,
    fare: FareBreakdown,
    method: WalletMethod
  ): Promise<PaymentResult> {
    try {
      // Check wallet balance
      const riderWallet = await this.getWallet(ride.riderId);
      if (riderWallet.balance < fare.total) {
        throw new Error('Insufficient wallet balance');
      }
      
      const transactionId = this.generateTransactionId();
      
      // Start transaction (simulate atomic operation)
      // In production, use Firestore transactions or Cloud SQL transactions
      
      // Deduct from rider wallet
      await this.deductFromWallet(ride.riderId, fare.total);
      
      // Add to driver wallet
      await this.addToWallet(ride.driverId, fare.driverEarnings);
      
      // Record transaction
      const transaction: Transaction = {
        id: transactionId,
        rideId: ride.id,
        riderId: ride.riderId,
        driverId: ride.driverId,
        amount: fare.total,
        method: 'WALLET',
        status: 'COMPLETED',
        transactionId,
        timestamp: new Date(),
        metadata: {
          riderWalletBalance: riderWallet.balance - fare.total,
          driverEarnings: fare.driverEarnings
        }
      };
      
      await this.firestore.collection('transactions').doc(transactionId).set(transaction);
      
      // Record payout
      const payout: Payout = {
        id: this.generatePayoutId(),
        driverId: ride.driverId,
        rideId: ride.id,
        amount: fare.total,
        platformFee: 0,
        netAmount: fare.driverEarnings,
        status: 'COMPLETED',
        timestamp: new Date()
      };
      
      await this.firestore.collection('payouts').doc(payout.id).set(payout);
      
      console.log(`✅ Wallet payment processed: ₹${fare.total} for ride ${ride.id}`);
      
      return {
        success: true,
        transactionId,
        amount: fare.total,
        method: 'WALLET',
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Wallet payment error:', error);
      throw error;
    }
  }
  
  /**
   * Process UPI payment
   * For demo purposes - in production integrate with payment gateway
   */
  private async processUPIPayment(
    ride: Ride,
    fare: FareBreakdown,
    method: PaymentMethod
  ): Promise<PaymentResult> {
    try {
      const transactionId = this.generateTransactionId();
      
      // In production, verify UPI transaction
      const transaction: Transaction = {
        id: transactionId,
        rideId: ride.id,
        riderId: ride.riderId,
        driverId: ride.driverId,
        amount: fare.total,
        method: 'UPI',
        status: 'COMPLETED',
        transactionId,
        timestamp: new Date(),
        metadata: {
          upiId: method.upiId
        }
      };
      
      await this.firestore.collection('transactions').doc(transactionId).set(transaction);
      
      // Driver payout
      const payout: Payout = {
        id: this.generatePayoutId(),
        driverId: ride.driverId,
        rideId: ride.id,
        amount: fare.total,
        platformFee: 0,
        netAmount: fare.driverEarnings,
        status: 'COMPLETED',
        timestamp: new Date()
      };
      
      await this.firestore.collection('payouts').doc(payout.id).set(payout);
      try {
        await pgPool.query(
          `INSERT INTO payouts(id, driver_id, ride_id, amount, platform_fee, net_amount, status, created_at)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
          [payout.id, payout.driverId, payout.rideId, payout.amount, payout.platformFee, payout.netAmount, payout.status, payout.timestamp]
        );
      } catch (sqlErr) {
        console.warn('Cloud SQL insert payout failed (non-fatal):', String(sqlErr));
      }

      await this.addToWallet(ride.driverId, fare.driverEarnings);
      
      return {
        success: true,
        transactionId,
        amount: fare.total,
        method: 'UPI',
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('UPI payment error:', error);
      throw error;
    }
  }
  
  /**
   * Get wallet for user
   */
  async getWallet(userId: string): Promise<Wallet> {
    try {
      const doc = await this.firestore.collection('wallets').doc(userId).get();
      
      if (doc.exists) {
        return doc.data() as Wallet;
      }
      
      // Create new wallet if doesn't exist
      const newWallet: Wallet = {
        userId,
        balance: 0,
        currency: 'INR',
        lastUpdated: new Date()
      };
      
      await this.firestore.collection('wallets').doc(userId).set(newWallet);
      return newWallet;
      
    } catch (error) {
      console.error('Get wallet error:', error);
      throw error;
    }
  }
  
  /**
   * Add funds to wallet
   */
  async addToWallet(userId: string, amount: number): Promise<void> {
    try {
      const walletRef = this.firestore.collection('wallets').doc(userId);
      const doc = await walletRef.get();
      
      if (doc.exists) {
        const wallet = doc.data() as Wallet;
        await walletRef.update({
          balance: wallet.balance + amount,
          lastUpdated: new Date()
        });
      } else {
        await walletRef.set({
          userId,
          balance: amount,
          currency: 'INR',
          lastUpdated: new Date()
        });
      }
      
      console.log(`✅ Added ₹${amount} to wallet ${userId}`);
    } catch (error) {
      console.error('Add to wallet error:', error);
      throw error;
    }
  }
  
  /**
   * Deduct funds from wallet
   */
  async deductFromWallet(userId: string, amount: number): Promise<void> {
    try {
      const walletRef = this.firestore.collection('wallets').doc(userId);
      const doc = await walletRef.get();
      
      if (!doc.exists) {
        throw new Error('Wallet not found');
      }
      
      const wallet = doc.data() as Wallet;
      if (wallet.balance < amount) {
        throw new Error('Insufficient balance');
      }
      
      await walletRef.update({
        balance: wallet.balance - amount,
        lastUpdated: new Date()
      });
      
      console.log(`✅ Deducted ₹${amount} from wallet ${userId}`);
    } catch (error) {
      console.error('Deduct from wallet error:', error);
      throw error;
    }
  }
  
  /**
   * Process refund
   */
  async processRefund(
    rideId: string,
    reason: string
  ): Promise<PaymentResult> {
    try {
      // Get original transaction
      const transactionsSnapshot = await this.firestore
        .collection('transactions')
        .where('rideId', '==', rideId)
        .limit(1)
        .get();
      
      if (transactionsSnapshot.empty) {
        throw new Error('Transaction not found');
      }
      
      const transaction = transactionsSnapshot.docs[0].data() as Transaction;
      
      // Calculate refund amount based on reason
      let refundAmount = transaction.amount;
      
      switch (reason) {
        case 'rider_cancelled_early':
          refundAmount = 0; // No refund
          break;
        case 'rider_cancelled_late':
          refundAmount = transaction.amount * 0.5; // 50% refund
          break;
        case 'driver_cancelled':
        case 'system_error':
          refundAmount = transaction.amount; // Full refund
          break;
      }
      
      if (refundAmount === 0) {
        return {
          success: true,
          transactionId: transaction.transactionId,
          amount: 0,
          method: 'REFUND',
          timestamp: new Date()
        };
      }
      
      // Process refund based on original payment method
      if (transaction.method === 'WALLET' || transaction.method === 'GOOGLE_PAY') {
        await this.addToWallet(transaction.riderId, refundAmount);
      }
      
      // Update transaction status in Firestore
      await this.firestore
        .collection('transactions')
        .doc(transaction.id)
        .update({ status: 'REFUNDED' });

      // Update transaction status in Cloud SQL if present
      try {
        await pgPool.query(`UPDATE transactions SET status = $1 WHERE id = $2`, ['REFUNDED', transaction.id]);
      } catch (sqlErr) {
        console.warn('Cloud SQL update transaction failed (non-fatal):', String(sqlErr));
      }
      
      console.log(`✅ Refund processed: ₹${refundAmount} for ride ${rideId}`);
      
      return {
        success: true,
        transactionId: this.generateTransactionId(),
        amount: refundAmount,
        method: 'REFUND',
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Refund processing error:', error);
      throw error;
    }
  }
  
  /**
   * Get transaction history for user
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 20
  ): Promise<Transaction[]> {
    try {
      // Prefer Cloud SQL for transaction history if available
      try {
        const { rows } = await pgPool.query(
          `SELECT id, ride_id, rider_id, driver_id, amount, method, status, transaction_id, metadata, created_at
           FROM transactions WHERE rider_id = $1 ORDER BY created_at DESC LIMIT $2`,
          [userId, limit]
        );
        return rows.map((r: any) => ({
          id: r.id,
          rideId: r.ride_id,
          riderId: r.rider_id,
          driverId: r.driver_id,
          amount: parseFloat(r.amount),
          method: r.method,
          status: r.status,
          transactionId: r.transaction_id,
          timestamp: r.created_at,
          metadata: r.metadata
        } as Transaction));
      } catch (sqlErr) {
        console.warn('Cloud SQL transaction history failed, falling back to Firestore:', String(sqlErr));
        const snapshot = await this.firestore
          .collection('transactions')
          .where('riderId', '==', userId)
          .orderBy('timestamp', 'desc')
          .limit(limit)
          .get();
        return snapshot.docs.map(doc => doc.data() as Transaction);
      }
    } catch (error) {
      console.error('Get transaction history error:', error);
      return [];
    }
  }
  
  /**
   * Get driver earnings summary
   */
  async getDriverEarnings(
    driverId: string,
    period: 'today' | 'week' | 'month' = 'today'
  ): Promise<{ total: number; rides: number; average: number }> {
    try {
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      const snapshot = await this.firestore
        .collection('payouts')
        .where('driverId', '==', driverId)
        .where('timestamp', '>=', startDate)
        .where('status', '==', 'COMPLETED')
        .get();
      
      const payouts = snapshot.docs.map(doc => doc.data() as Payout);
      const total = payouts.reduce((sum, p) => sum + p.netAmount, 0);
      const rides = payouts.length;
      const average = rides > 0 ? total / rides : 0;
      
      return { total, rides, average };
    } catch (error) {
      console.error('Get driver earnings error:', error);
      return { total: 0, rides: 0, average: 0 };
    }
  }
  
  /**
   * Log payment failure
   */
  private async logPaymentFailure(ride: Ride, error: Error): Promise<void> {
    try {
      await this.firestore.collection('payment_failures').add({
        rideId: ride.id,
        riderId: ride.riderId,
        driverId: ride.driverId,
        error: error.message,
        stack: error.stack,
        timestamp: new Date()
      });
    } catch (logError) {
      console.error('Failed to log payment failure:', logError);
    }
  }
  
  /**
   * Generate transaction ID
   */
  private generateTransactionId(): string {
    return `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
  
  /**
   * Generate payout ID
   */
  private generatePayoutId(): string {
    return `PAY_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
