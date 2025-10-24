/**
 * OLA-Style Rider Dashboard with Live Map and Booking Flow
 * Clean, modern interface focused on booking rides quickly
 */

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { 
  MapPin, 
  Navigation, 
  Menu, 
  Clock,
  IndianRupee,
  Car,
  Bike,
  X,
  ChevronDown,
  History,
  User,
  Wallet,
  Settings,
  LogOut
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  initializeMap,
  getCurrentLocation,
  createUserMarker,
  createPickupMarker,
  createDropMarker,
  createMarker,
  initAutocomplete,
  calculateRoute,
  getETA,
  getDistance,
  calculateFare,
  renderRoute,
  reverseGeocode,
  loadMapsAPI,
  isMapsLoaded,
  animateMarker,
  type LatLng
} from '@/services/mapService';
import {
  initSocket,
  requestRide,
  onDriverAssigned,
  onDriverLocationUpdate,
  onRideStatusUpdate,
  removeRiderListeners,
  type RideRequest,
  type RideDetails
} from '@/services/socketService';

type BookingStep = 'location' | 'vehicle' | 'searching' | 'active';
type VehicleType = 'auto' | 'bike' | 'car';

interface VehicleOption {
  type: VehicleType;
  name: string;
  icon: typeof Car;
  eta: number;
  fare: number;
  capacity: string;
}

export default function RiderDashboard() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Map refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const dropMarkerRef = useRef<google.maps.Marker | null>(null);
  const driverLiveMarkerRef = useRef<google.maps.Marker | null>(null);
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [pickupLocation, setPickupLocation] = useState<LatLng & { address: string } | null>(null);
  const [dropLocation, setDropLocation] = useState<LatLng & { address: string } | null>(null);
  const [bookingStep, setBookingStep] = useState<BookingStep>('location');
  const [vehicleOptions, setVehicleOptions] = useState<VehicleOption[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | null>(null);
  const [currentRide, setCurrentRide] = useState<RideDetails | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  
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
        
        // Get user location
        const position = await getCurrentLocation();
        const userLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setUserLocation(userLoc);
        
        // Initialize map
        if (mapRef.current && !mapInstanceRef.current) {
          const map = initializeMap(mapRef.current, {
            center: userLoc,
            zoom: 15
          });
          mapInstanceRef.current = map;
          // Traffic layer for live conditions
          // @ts-ignore - visualization not required here
          const trafficLayer = new google.maps.TrafficLayer();
          trafficLayer.setMap(map);
          
          // Add user marker
          const marker = createUserMarker(map, userLoc);
          userMarkerRef.current = marker;
          
          // Get address for pickup
          const address = await reverseGeocode(userLoc);
          setPickupLocation({ ...userLoc, address });
          
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
  
  // Initialize autocomplete for pickup and drop
  useEffect(() => {
    if (!mapLoaded) return;
    
    if (pickupInputRef.current) {
      initAutocomplete(pickupInputRef.current, (place) => {
        if (place.geometry?.location) {
          const loc = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address || place.name || ''
          };
          setPickupLocation(loc);
          
          // Update map center
          mapInstanceRef.current?.setCenter(loc);
        }
      });
    }
    
    if (dropInputRef.current) {
      initAutocomplete(dropInputRef.current, (place) => {
        if (place.geometry?.location) {
          const loc = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address || place.name || ''
          };
          setDropLocation(loc);
        }
      });
    }
  }, [mapLoaded]);
  
  // Calculate vehicle options when both locations are set
  useEffect(() => {
    if (!pickupLocation || !dropLocation) return;
    
    const calculateOptions = async () => {
      try {
        const distance = await getDistance(pickupLocation, dropLocation);
        const eta = await getETA(pickupLocation, dropLocation);
        
        const options: VehicleOption[] = [
          {
            type: 'auto',
            name: 'Auto',
            icon: Car,
            eta: Math.ceil(eta / 60),
            fare: calculateFare(distance, 'auto'),
            capacity: '3 seats'
          },
          {
            type: 'bike',
            name: 'Bike',
            icon: Bike,
            eta: Math.ceil(eta / 60) - 2,
            fare: calculateFare(distance, 'bike'),
            capacity: '1 seat'
          },
          {
            type: 'car',
            name: 'Prime Sedan',
            icon: Car,
            eta: Math.ceil(eta / 60),
            fare: calculateFare(distance, 'car'),
            capacity: '4 seats'
          }
        ];
        
        setVehicleOptions(options);
        setBookingStep('vehicle');
        
        // Show route on map with pickup/drop markers
        if (mapInstanceRef.current) {
          const route = await calculateRoute(pickupLocation, dropLocation);
          renderRoute(mapInstanceRef.current, route);
          
          // Add pickup marker
          if (pickupMarkerRef.current) {
            pickupMarkerRef.current.setMap(null);
          }
          pickupMarkerRef.current = createPickupMarker(
            mapInstanceRef.current,
            pickupLocation,
            pickupLocation.address
          );
          
          // Add drop marker
          if (dropMarkerRef.current) {
            dropMarkerRef.current.setMap(null);
          }
          dropMarkerRef.current = createDropMarker(
            mapInstanceRef.current,
            dropLocation,
            dropLocation.address
          );
        }
      } catch (error) {
        console.error('Failed to calculate route:', error);
        toast({
          title: 'Route Error',
          description: 'Unable to calculate route. Please try again.',
          variant: 'destructive'
        });
      }
    };
    
    calculateOptions();
  }, [pickupLocation, dropLocation]);
  
  // Initialize Socket.IO
  useEffect(() => {
    if (!user?.id) return;
    
    const socket = initSocket(user.id, 'rider');
    
    // Listen for driver assignment
    onDriverAssigned((data) => {
      toast({
        title: 'Driver Assigned!',
        description: `${data.driver.vehicleType.toUpperCase()} driver is on the way`,
      });
      setBookingStep('active');
    });
    
    // Listen for ride status updates
    onRideStatusUpdate((ride) => {
      setCurrentRide(ride);
      
      if (ride.status === 'completed') {
        toast({
          title: 'Ride Completed',
          description: 'Thank you for riding with us!',
        });
        // Reset to initial state
        setBookingStep('location');
        setDropLocation(null);
        setSelectedVehicle(null);
        setCurrentRide(null);
      }
    });

    // Live driver location updates
    onDriverLocationUpdate((loc) => {
      if (!mapInstanceRef.current) return;
      if (!driverLiveMarkerRef.current) {
        driverLiveMarkerRef.current = createMarker(mapInstanceRef.current, loc, {
          icon: {
            url: '/markers/car.svg',
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
          },
          title: 'Driver'
        });
      } else {
        animateMarker(driverLiveMarkerRef.current, loc);
      }
    });
    
    return () => {
      removeRiderListeners();
    };
  }, [user?.id]);
  
  const handleConfirmRide = () => {
    if (!pickupLocation || !dropLocation || !selectedVehicle || !user?.id) return;
    
    const selectedOption = vehicleOptions.find(v => v.type === selectedVehicle);
    if (!selectedOption) return;
    
    const rideRequest: RideRequest = {
      riderId: user.id,
      pickup: pickupLocation,
      drop: dropLocation,
      vehicleType: selectedVehicle,
      fare: selectedOption.fare,
      distance: 0 // Will be calculated on server
    };
    
    requestRide(rideRequest);
    setBookingStep('searching');
    
    toast({
      title: 'Searching for drivers...',
      description: 'Please wait while we find a driver nearby',
    });
  };
  
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
          
          <div className="flex items-center gap-2 bg-background rounded-full px-4 py-2 shadow-lg">
            <Wallet className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold">₹0</span>
          </div>
        </div>
      </div>
      
      {/* Bottom Sheet - Location Selection */}
      {bookingStep === 'location' && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-background rounded-t-3xl shadow-2xl p-6 max-h-[50vh] overflow-y-auto">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
          
          <h2 className="text-xl font-bold mb-4">Where do you want to go?</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="w-0.5 h-8 bg-gray-300" />
                <div className="w-3 h-3 rounded-full border-2 border-red-500" />
              </div>
              
              <div className="flex-1 space-y-3">
                <Input
                  ref={pickupInputRef}
                  placeholder="Pickup location"
                  defaultValue={pickupLocation?.address || ''}
                  className="bg-gray-100 border-none"
                />
                
                <Input
                  ref={dropInputRef}
                  placeholder="Where to?"
                  className="bg-gray-100 border-none"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex gap-3">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={!dropLocation}
              onClick={() => setBookingStep('vehicle')}
            >
              Continue
            </Button>
          </div>
        </div>
      )}
      
      {/* Bottom Sheet - Vehicle Selection */}
      {bookingStep === 'vehicle' && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-background rounded-t-3xl shadow-2xl p-6 max-h-[70vh] overflow-y-auto">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4"
            onClick={() => setBookingStep('location')}
          >
            <X className="h-5 w-5" />
          </Button>
          
          <h2 className="text-xl font-bold mb-4">Choose your ride</h2>
          
          <div className="space-y-3">
            {vehicleOptions.map((vehicle) => {
              const Icon = vehicle.icon;
              return (
                <Card
                  key={vehicle.type}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedVehicle === vehicle.type 
                      ? 'border-green-600 border-2 bg-green-50' 
                      : 'hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedVehicle(vehicle.type)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-8 w-8" />
                      <div>
                        <h3 className="font-semibold">{vehicle.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {vehicle.eta} mins • {vehicle.capacity}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center font-bold text-lg">
                        <IndianRupee className="h-4 w-4" />
                        {vehicle.fare}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          
          <Button
            className="w-full mt-6 bg-green-600 hover:bg-green-700 h-12"
            disabled={!selectedVehicle}
            onClick={handleConfirmRide}
          >
            Confirm Ride
          </Button>
        </div>
      )}
      
      {/* Searching for Driver */}
      {bookingStep === 'searching' && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-background rounded-t-3xl shadow-2xl p-8 text-center">
          <div className="mx-auto mb-4">
            <LoadingSpinner />
          </div>
          <h2 className="text-xl font-bold mb-2">Finding your driver...</h2>
          <p className="text-gray-600">This usually takes a few seconds</p>
          
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              setBookingStep('location');
              toast({ title: 'Ride cancelled' });
            }}
          >
            Cancel
          </Button>
        </div>
      )}
      
      {/* Active Ride */}
      {bookingStep === 'active' && currentRide && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-background rounded-t-3xl shadow-2xl p-6">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-6 w-6" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold">Driver Name</h3>
              <p className="text-sm text-gray-600">
                {selectedVehicle?.toUpperCase()} • 5 mins away
              </p>
            </div>
            
            <Button size="icon" variant="outline">
              <Navigation className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              Cancel Ride
            </Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700">
              Call Driver
            </Button>
          </div>
        </div>
      )}
      
      {/* Menu Drawer */}
      <Dialog open={showMenu} onOpenChange={setShowMenu}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Menu</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start" onClick={() => {
              setShowMenu(false);
              setLocation('/rider/history');
            }}>
              <History className="mr-2 h-4 w-4" />
              Ride History
            </Button>
            
            <Button variant="ghost" className="w-full justify-start" onClick={() => {
              setShowMenu(false);
              setLocation('/rider/profile');
            }}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
            
            <Button variant="ghost" className="w-full justify-start" onClick={() => {
              setShowMenu(false);
              setLocation('/rider/wallet');
            }}>
              <Wallet className="mr-2 h-4 w-4" />
              Wallet
            </Button>
            
            <Button variant="ghost" className="w-full justify-start" onClick={() => {
              setShowMenu(false);
              setLocation('/rider/settings');
            }}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
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
