export type AdminStats = {
  totalUsers: number;
  activeDrivers: number;
  totalRevenue: string | number;
  totalRides: number;
  todayRides: number;
  weekRides: number;
  monthRides: number;
  vehicleStats: {
    e_rickshaw: number;
    e_scooter: number;
    cng_car: number;
  };
};

export type Ride = {
  id: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  vehicleType: 'e_rickshaw' | 'e_scooter' | 'cng_car';
  estimatedFare?: string | number;
};

export type DriverStats = {
  totalRides: number;
  totalEarnings: string | number;
  rating: string | number;
  todayEarnings: string | number;
};

export type RiderStats = {
  totalRides: number;
  badgesEarned: number;
};

export type Badge = {
  id: string;
  name: string;
  description?: string;
  iconName: string;
  requiredPoints: number;
  earned?: boolean;
};
