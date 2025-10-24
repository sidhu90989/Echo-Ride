/**
 * OLA-Style Driver Dashboard with Live Tracking
 * Real-time location updates, ride management, and earnings tracking
 */

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  MapPin, 
  Navigation, 
  Menu, 
  Clock,
  IndianRupee,
  Star,
  TrendingUp,
  User,
  Phone,
  X,
  CheckCircle,
  XCircle,
  History,
  Settings,
  LogOut,
  Wallet,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  initializeMap,
  getCurrentLocation,
  createUserMarker,
  calculateRoute,
  renderRoute,
  reverseGeocode,
  loadMapsAPI,
  isMapsLoaded,
  animateMarker,
  type LatLng
} from '@/services/mapService';
import {
  initSocket,
  sendDriverLocationUpdate,
  updateDriverStatus,
  acceptRideRequest,
  rejectRideRequest,
  startRide,
  completeRide,
  onRideRequest,
  offRideRequest,
  startDriverLocationTracking,
  type RideDetails
} from '@/services/socketService';

type DriverStatus = 'offline' | 'online' | 'on_ride';
type RideStatus = 'pending' | 'accepted' | 'arrived' | 'in_progress' | 'completed';

interface DriverStats {
  todayEarnings: number;
  todayRides: number;
  rating: number;
  totalRides: number;
}

export default function DriverDashboard() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Map refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const routeRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  
  // State
  const [mapLoaded, setMapLoaded] = useState(false);
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [driverStatus, setDriverStatus] = useState<DriverStatus>('offline');
  const [currentRide, setCurrentRide] = useState<RideDetails | null>(null);
  const [rideStatus, setRideStatus] = useState<RideStatus | null>(null);
  const [pendingRideRequest, setPendingRideRequest] = useState<RideDetails | null>(null);
  const [showRideRequest, setShowRideRequest] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [requestCountdown, setRequestCountdown] = useState(30);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationTrackingCleanup, setLocationTrackingCleanup] = useState<(() => void) | null>(null);
  
  // Driver stats (would come from API in production)
  const [stats, setStats] = useState<DriverStats>({
    todayEarnings: 0,
    todayRides: 0,
    rating: 4.8,
    totalRides: 0
  });
  
  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          toast({
            title: 'Configuration Error',
            description: 'Google Maps API key not found',
            variant: 'destructive'
          });
          return;
        }
        
        if (!isMapsLoaded()) {
          await loadMapsAPI(apiKey);
        }
        
        // Get driver location
        const position = await getCurrentLocation();
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setDriverLocation(loc);
        
        // Initialize map
        if (mapRef.current && !mapInstanceRef.current) {
          const map = initializeMap(mapRef.current, {
            center: loc,
            zoom: 15
          });
          mapInstanceRef.current = map;
          
          // Add driver marker
          const marker = createUserMarker(map, loc);
          driverMarkerRef.current = marker;
          
          setMapLoaded(true);
        }
        
        setIsLoadingLocation(false);
      } catch (error) {
        console.error('Map initialization error:', error);
        toast({
          title: 'Location Error',
          description: 'Unable to get your location. Please enable location services.',
          variant: 'destructive'
        });
        setIsLoadingLocation(false);
      }
    };
    
    initMap();
  }, []);

  // Heatmap for high-demand areas when online and idle
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    if (driverStatus === 'online' && !currentRide && driverLocation) {
      // Generate simple synthetic hotspots around the driver location
      const base = driverLocation;
      const jitter = (n: number) => (Math.random() - 0.5) * n;
      const points = Array.from({ length: 30 }).map(() => ({
        lat: base.lat + jitter(0.01),
        lng: base.lng + jitter(0.01),
      }));
      const mvcArray = new google.maps.MVCArray(
        points.map(p => new google.maps.LatLng(p.lat, p.lng))
      );
      if (!heatmapRef.current) {
        // @ts-ignore - visualization namespace available via script param
        heatmapRef.current = new google.maps.visualization.HeatmapLayer({
          data: mvcArray,
          radius: 32,
          opacity: 0.6,
        });
      } else {
        heatmapRef.current.setData(mvcArray);
      }
      heatmapRef.current.setMap(mapInstanceRef.current);
    } else {
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }
    }
  }, [mapLoaded, driverStatus, currentRide, driverLocation]);
  
  // Initialize Socket.IO and handle ride requests
  useEffect(() => {
    if (!user?.id || !mapLoaded) return;
    
    const socket = initSocket(user.id, 'driver');
    
    // Listen for ride requests
    onRideRequest((ride) => {
      setPendingRideRequest(ride);
      setShowRideRequest(true);
      setRequestCountdown(30);
      
      toast({
        title: 'New Ride Request!',
        description: `Pickup: ${ride.pickup.address}`,
      });
    });
    
    return () => {
      offRideRequest();
    };
  }, [user?.id, mapLoaded]);
  
  // Countdown timer for ride request
  useEffect(() => {
    if (!showRideRequest || requestCountdown <= 0) return;
    
    const timer = setInterval(() => {
      setRequestCountdown(prev => {
        if (prev <= 1) {
          handleRejectRide();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [showRideRequest, requestCountdown]);
  
  // Handle driver status change (online/offline)
  const handleStatusChange = (isOnline: boolean) => {
    if (!user?.id || !driverLocation) return;
    
    const newStatus: DriverStatus = isOnline ? 'online' : 'offline';
    setDriverStatus(newStatus);
    updateDriverStatus(user.id, isOnline);
    
    if (isOnline) {
      // Start sending location updates every 10 seconds
      const cleanup = startDriverLocationTracking(user.id, () => driverLocation);
      setLocationTrackingCleanup(() => cleanup);
      
      toast({
        title: 'You are now online',
        description: 'Waiting for ride requests...',
      });
    } else {
      // Stop location tracking
      if (locationTrackingCleanup) {
        locationTrackingCleanup();
        setLocationTrackingCleanup(null);
      }
      
      toast({
        title: 'You are now offline',
        description: 'You won\'t receive ride requests',
      });
    }
  };
  
  // Accept ride request
  const handleAcceptRide = async () => {
    if (!pendingRideRequest || !user?.id) return;
    
    acceptRideRequest(pendingRideRequest.id, user.id);
    setCurrentRide(pendingRideRequest);
    setRideStatus('accepted');
    setShowRideRequest(false);
    setDriverStatus('on_ride');
    
    // Show route to pickup
    if (mapInstanceRef.current && driverLocation) {
      try {
        const route = await calculateRoute(driverLocation, pendingRideRequest.pickup);
        const renderer = renderRoute(mapInstanceRef.current, route, { strokeColor: '#3b82f6' });
        routeRendererRef.current = renderer;
      } catch (error) {
        console.error('Failed to calculate route:', error);
      }
    }
    
    toast({
      title: 'Ride Accepted',
      description: 'Navigate to pickup location',
    });
  };
  
  // Reject ride request
  const handleRejectRide = () => {
    if (!pendingRideRequest || !user?.id) return;
    
    rejectRideRequest(pendingRideRequest.id, user.id, 'Driver declined');
    setPendingRideRequest(null);
    setShowRideRequest(false);
    setRequestCountdown(30);
    
    toast({
      title: 'Ride Rejected',
      description: 'Waiting for more requests...',
    });
  };
  
  // Start ride (picked up customer)
  const handleStartRide = async () => {
    if (!currentRide) return;
    
    startRide(currentRide.id);
    setRideStatus('in_progress');
    
    // Clear previous route and show route to drop
    if (routeRendererRef.current) {
      routeRendererRef.current.setMap(null);
    }
    
    if (mapInstanceRef.current && driverLocation) {
      try {
        const route = await calculateRoute(driverLocation, currentRide.drop);
        const renderer = renderRoute(mapInstanceRef.current, route, { strokeColor: '#22c55e' });
        routeRendererRef.current = renderer;
      } catch (error) {
        console.error('Failed to calculate route:', error);
      }
    }
    
    toast({
      title: 'Ride Started',
      description: 'Navigate to drop location',
    });
  };
  
  // Complete ride (dropped off customer)
  const handleCompleteRide = () => {
    if (!currentRide) return;
    
    completeRide(currentRide.id);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      todayEarnings: prev.todayEarnings + currentRide.fare,
      todayRides: prev.todayRides + 1,
      totalRides: prev.totalRides + 1
    }));
    
    // Clear route
    if (routeRendererRef.current) {
      routeRendererRef.current.setMap(null);
    }
    
    // Reset state
    setCurrentRide(null);
    setRideStatus(null);
    setDriverStatus('online');
    
    toast({
      title: 'Ride Completed!',
      description: `You earned ₹${currentRide.fare}`,
    });
  };
  
  // Update driver marker position
  useEffect(() => {
    if (driverMarkerRef.current && driverLocation) {
      animateMarker(driverMarkerRef.current, driverLocation);
    }
  }, [driverLocation]);
  
  if (!user) {
    setLocation('/login');
    return null;
  }
  
  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Map Container */}
      <div ref={mapRef} className="absolute inset-0 h-full w-full" />
      
      {/* Loading Overlay */}
      {isLoadingLocation && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <LoadingSpinner />
          <p className="ml-3 text-lg">Getting your location...</p>
        </div>
      )}
      
      {/* Offline Overlay */}
      {driverStatus === 'offline' && !isLoadingLocation && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 backdrop-blur-sm">
          <Card className="p-8 text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You're Offline</h2>
            <p className="text-gray-600 mb-6">Go online to start receiving ride requests</p>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 h-12"
              onClick={() => handleStatusChange(true)}
            >
              Go Online
            </Button>
          </Card>
        </div>
      )}
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-background/90 to-transparent">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="bg-background shadow-lg"
            onClick={() => setShowMenu(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            {/* Online/Offline Switch */}
            {driverStatus !== 'on_ride' && (
              <div className="flex items-center gap-2 bg-background rounded-full px-4 py-2 shadow-lg">
                <Switch 
                  checked={driverStatus === 'online'}
                  onCheckedChange={handleStatusChange}
                />
                <span className="text-sm font-semibold">
                  {driverStatus === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            )}
            
            {/* Today's Earnings */}
            <div className="flex items-center gap-2 bg-green-600 text-white rounded-full px-4 py-2 shadow-lg">
              <IndianRupee className="h-4 w-4" />
              <span className="text-sm font-semibold">{stats.todayEarnings}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Bar (when online and no ride) */}
      {driverStatus === 'online' && !currentRide && (
        <div className="absolute top-20 left-4 right-4 z-20">
          <Card className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-lg font-bold">
                  <IndianRupee className="h-4 w-4" />
                  {stats.todayEarnings}
                </div>
                <p className="text-xs text-gray-600">Today's Earnings</p>
              </div>
              
              <div className="text-center border-x">
                <div className="text-lg font-bold">{stats.todayRides}</div>
                <p className="text-xs text-gray-600">Rides Today</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-lg font-bold">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {stats.rating}
                </div>
                <p className="text-xs text-gray-600">Rating</p>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      {/* Waiting for Rides Status */}
      {driverStatus === 'online' && !currentRide && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-background rounded-t-3xl shadow-2xl p-6">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3 animate-pulse">
              <Navigation className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Waiting for rides...</h3>
            <p className="text-sm text-gray-600">You'll get notified when a customer requests a ride</p>
          </div>
        </div>
      )}
      
      {/* Active Ride Info */}
      {currentRide && rideStatus && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-background rounded-t-3xl shadow-2xl p-6">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          
          {/* Rider Info */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-6 w-6" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold">Customer</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {currentRide.vehicleType.toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-600">
                  ₹{currentRide.fare}
                </span>
              </div>
            </div>
            
            <Button size="icon" variant="outline">
              <Phone className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Locations */}
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium">Pickup</p>
                <p className="text-xs text-gray-600">{currentRide.pickup.address}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium">Drop</p>
                <p className="text-xs text-gray-600">{currentRide.drop.address}</p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-2">
            {rideStatus === 'accepted' && (
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 h-12"
                onClick={handleStartRide}
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Start Ride (Customer Picked Up)
              </Button>
            )}
            
            {rideStatus === 'in_progress' && (
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                onClick={handleCompleteRide}
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Complete Ride (Customer Dropped)
              </Button>
            )}
            
            <Button variant="outline" className="w-full">
              <Navigation className="mr-2 h-4 w-4" />
              Navigate with Google Maps
            </Button>
          </div>
        </div>
      )}
      
      {/* Ride Request Dialog */}
      <Dialog open={showRideRequest} onOpenChange={(open) => {
        if (!open) handleRejectRide();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>New Ride Request</span>
              <Badge variant="destructive">{requestCountdown}s</Badge>
            </DialogTitle>
          </DialogHeader>
          
          {pendingRideRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Fare</span>
                  <div className="flex items-center text-2xl font-bold text-green-600">
                    <IndianRupee className="h-5 w-5" />
                    {pendingRideRequest.fare}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Distance</span>
                  <span className="text-sm font-semibold">
                    {(pendingRideRequest.distance / 1000).toFixed(1)} km
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Pickup</p>
                    <p className="text-xs text-gray-600">{pendingRideRequest.pickup.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Drop</p>
                    <p className="text-xs text-gray-600">{pendingRideRequest.drop.address}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 h-12"
              onClick={handleAcceptRide}
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Accept Ride
            </Button>
            <Button 
              variant="outline"
              className="w-full"
              onClick={handleRejectRide}
            >
              <XCircle className="mr-2 h-5 w-5" />
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Menu Drawer */}
      <Dialog open={showMenu} onOpenChange={setShowMenu}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Menu</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start" onClick={() => {
              setShowMenu(false);
              setLocation('/driver/earnings');
            }}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Earnings
            </Button>

            <Button variant="ghost" className="w-full justify-start" onClick={() => {
              setShowMenu(false);
              setLocation('/driver/ride-management');
            }}>
              <History className="mr-2 h-4 w-4" />
              Ride Management
            </Button>

            <Button variant="ghost" className="w-full justify-start" onClick={() => {
              setShowMenu(false);
              setLocation('/driver/profile');
            }}>
              <User className="mr-2 h-4 w-4" />
              Profile & Settings
            </Button>
            
            <hr className="my-2" />
            
            <Button variant="ghost" className="w-full justify-start text-red-600" onClick={() => {
              signOut();
              setLocation('/login');
            }}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
