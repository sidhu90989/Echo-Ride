-- Cloud SQL Schema for EcoRide (Google Cloud)
-- PostgreSQL database schema for ride-hailing system

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  role VARCHAR(20) CHECK (role IN ('rider', 'driver', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Driver profiles
CREATE TABLE IF NOT EXISTS driver_profiles (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type VARCHAR(20) CHECK (vehicle_type IN ('auto', 'bike', 'car')),
  vehicle_number VARCHAR(50),
  license_number VARCHAR(50),
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_rides INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT false,
  current_lat DECIMAL(10,8),
  current_lng DECIMAL(11,8),
  city VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rides table
CREATE TABLE IF NOT EXISTS rides (
  id VARCHAR(255) PRIMARY KEY,
  rider_id VARCHAR(255) REFERENCES users(id),
  driver_id VARCHAR(255) REFERENCES users(id),
  vehicle_type VARCHAR(20),
  pickup_lat DECIMAL(10,8) NOT NULL,
  pickup_lng DECIMAL(11,8) NOT NULL,
  pickup_address TEXT,
  drop_lat DECIMAL(10,8) NOT NULL,
  drop_lng DECIMAL(11,8) NOT NULL,
  drop_address TEXT,
  distance DECIMAL(10,2),
  duration INTEGER,
  fare DECIMAL(10,2),
  status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'started', 'completed', 'cancelled')),
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(255) PRIMARY KEY,
  ride_id VARCHAR(255) REFERENCES rides(id),
  rider_id VARCHAR(255) REFERENCES users(id),
  driver_id VARCHAR(255) REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(20) CHECK (method IN ('GOOGLE_PAY', 'CASH', 'WALLET', 'UPI')),
  status VARCHAR(20) CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
  transaction_id VARCHAR(255) UNIQUE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id VARCHAR(255) PRIMARY KEY,
  driver_id VARCHAR(255) REFERENCES users(id),
  ride_id VARCHAR(255) REFERENCES rides(id),
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment failures log
CREATE TABLE IF NOT EXISTS payment_failures (
  id SERIAL PRIMARY KEY,
  ride_id VARCHAR(255),
  rider_id VARCHAR(255),
  driver_id VARCHAR(255),
  error TEXT,
  stack TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  ride_id VARCHAR(255) REFERENCES rides(id),
  rider_id VARCHAR(255) REFERENCES users(id),
  driver_id VARCHAR(255) REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rides_rider ON rides(rider_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_created ON rides(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_ride ON transactions(ride_id);
CREATE INDEX IF NOT EXISTS idx_transactions_rider ON transactions(rider_id);
CREATE INDEX IF NOT EXISTS idx_payouts_driver ON payouts(driver_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_available ON driver_profiles(is_available) WHERE is_available = true;

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_profiles_updated_at BEFORE UPDATE ON driver_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
