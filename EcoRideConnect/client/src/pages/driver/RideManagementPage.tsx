import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  ArrowLeft,
  Navigation,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Timer,
  Route,
  Star,
  Camera,
  Fuel,
  Car,
  PlayCircle,
  StopCircle,
  Users,
  Shield,
  Bell
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { RideMap, type LatLng } from "@/components/maps/RideMap";

interface RideDetails {
  id: string;
  riderName: string;
  riderPhone: string;
  riderRating: number;
  pickupLocation: string;
  pickupCoords: LatLng;
  dropoffLocation: string;
  dropoffCoords: LatLng;
  estimatedFare: number;
  distance: number;
  duration: number;
  vehicleType: string;
  rideStatus: 'accepted' | 'enroute_pickup' | 'arrived_pickup' | 'in_progress' | 'completed';
  startTime?: Date;
  pickupTime?: Date;
  specialInstructions?: string;
}

export default function RideManagementPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Mock ride data - in real app, this would come from URL params or state
  const [currentRide] = useState<RideDetails>({
    id: "ride_123",
    riderName: "Priya Sharma",
    riderPhone: "+91 98765 43210",
    riderRating: 4.7,
    pickupLocation: "Phoenix MarketCity Mall, Whitefield",
    pickupCoords: { lat: 12.9979, lng: 77.6958 },
    dropoffLocation: "Electronic City Metro Station",
    dropoffCoords: { lat: 12.8456, lng: 77.6603 },
    estimatedFare: 320,
    distance: 18.5,
    duration: 35,
    vehicleType: "sedan",
    rideStatus: 'accepted',
    specialInstructions: "Please call when you arrive at the pickup location"
  });

  const [rideStatus, setRideStatus] = useState(currentRide.rideStatus);
  const [tripTimer, setTripTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [driverLocation, setDriverLocation] = useState<LatLng>({ lat: 12.9716, lng: 77.5946 });

  // Timer for trip duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTripTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Format timer display
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStatusUpdate = (newStatus: RideDetails['rideStatus']) => {
    setRideStatus(newStatus);
    
    switch (newStatus) {
      case 'enroute_pickup':
        toast({
          title: "Navigation Started 🗺️",
          description: "Heading to pickup location",
        });
        break;
      case 'arrived_pickup':
        toast({
          title: "Arrived at Pickup 📍",
          description: "Call rider to confirm pickup",
        });
        break;
      case 'in_progress':
        setIsTimerRunning(true);
        toast({
          title: "Trip Started 🚗",
          description: "Timer started. Drive safely!",
        });
        break;
      case 'completed':
        setIsTimerRunning(false);
        toast({
          title: "Trip Completed! 🎉",
          description: "Collect payment and rate the rider",
        });
        break;
    }
  };

  const openGoogleMaps = (destination: LatLng, address: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&destination_place_id=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
    toast({
      title: "Opening Google Maps 🗺️",
      description: "Navigation started in Google Maps",
    });
  };

  const callRider = () => {
    window.open(`tel:${currentRide.riderPhone}`, '_self');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/driver")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-serif text-xl font-bold">Ride Management</h1>
          <ThemeToggle />
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Trip Status Banner */}
        <Card className="p-4 border-2 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <h2 className="text-lg font-bold">
                {rideStatus === 'accepted' && '📋 Ride Accepted'}
                {rideStatus === 'enroute_pickup' && '🚗 En Route to Pickup'}
                {rideStatus === 'arrived_pickup' && '📍 Arrived at Pickup'}
                {rideStatus === 'in_progress' && '🛣️ Trip in Progress'}
                {rideStatus === 'completed' && '✅ Trip Completed'}
              </h2>
            </div>
            {rideStatus === 'in_progress' && (
              <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
                <Timer className="h-4 w-4 text-primary" />
                <span className="font-mono text-lg font-bold">{formatTimer(tripTimer)}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Trip ID: #{currentRide.id.slice(-6).toUpperCase()}
            </div>
            <div className="text-2xl font-bold text-green-600">
              ₹{currentRide.estimatedFare}
            </div>
          </div>
        </Card>

        {/* Rider Information */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Rider Details
            </h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={callRider}>
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button size="sm" variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg">{currentRide.riderName}</h4>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span>{currentRide.riderRating.toFixed(1)}</span>
                </div>
                <span>{currentRide.riderPhone}</span>
              </div>
            </div>
          </div>
          
          {currentRide.specialInstructions && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Bell className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Special Instructions
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-200">
                    {currentRide.specialInstructions}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Trip Route & Map */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Route className="h-5 w-5 text-primary" />
              Trip Route
            </h3>
            <Badge variant="secondary">
              {currentRide.distance} km • {currentRide.duration} min
            </Badge>
          </div>
          
          {/* Route Details */}
          <div className="space-y-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-2" />
              <div className="flex-1">
                <div className="font-medium">Pickup Location</div>
                <div className="text-sm text-muted-foreground">{currentRide.pickupLocation}</div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => openGoogleMaps(currentRide.pickupCoords, currentRide.pickupLocation)}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Navigate
              </Button>
            </div>
            
            <div className="ml-6 border-l-2 border-dashed border-gray-300 h-8" />
            
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-2" />
              <div className="flex-1">
                <div className="font-medium">Drop Location</div>
                <div className="text-sm text-muted-foreground">{currentRide.dropoffLocation}</div>
              </div>
              {rideStatus === 'in_progress' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => openGoogleMaps(currentRide.dropoffCoords, currentRide.dropoffLocation)}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Navigate
                </Button>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="h-64 bg-muted rounded-lg overflow-hidden">
            <RideMap
              apiKey="mock-api-key"
              pickup={currentRide.pickupCoords}
              dropoff={currentRide.dropoffCoords}
              height={256}
            />
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {rideStatus === 'accepted' && (
            <Button 
              className="w-full h-12 text-lg" 
              onClick={() => handleStatusUpdate('enroute_pickup')}
            >
              <PlayCircle className="h-5 w-5 mr-2" />
              Start Trip - Head to Pickup
            </Button>
          )}
          
          {rideStatus === 'enroute_pickup' && (
            <Button 
              className="w-full h-12 text-lg" 
              onClick={() => handleStatusUpdate('arrived_pickup')}
            >
              <MapPin className="h-5 w-5 mr-2" />
              I've Arrived at Pickup
            </Button>
          )}
          
          {rideStatus === 'arrived_pickup' && (
            <Button 
              className="w-full h-12 text-lg" 
              onClick={() => handleStatusUpdate('in_progress')}
            >
              <PlayCircle className="h-5 w-5 mr-2" />
              Start Trip - Rider Onboard
            </Button>
          )}
          
          {rideStatus === 'in_progress' && (
            <Button 
              className="w-full h-12 text-lg bg-green-600 hover:bg-green-700" 
              onClick={() => handleStatusUpdate('completed')}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              End Trip - Arrived at Destination
            </Button>
          )}
          
          {rideStatus === 'completed' && (
            <div className="space-y-3">
              <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200">
                <div className="text-center space-y-2">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                    Trip Completed Successfully! 🎉
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Total trip time: {formatTimer(tripTimer)}
                  </p>
                </div>
              </Card>
              
              <Button 
                className="w-full h-12 text-lg" 
                onClick={() => setLocation('/driver/payment')}
              >
                <DollarSign className="h-5 w-5 mr-2" />
                Collect Payment - ₹{currentRide.estimatedFare}
              </Button>
            </div>
          )}
        </div>

        {/* Emergency Actions */}
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/20">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800 dark:text-red-200">Emergency Actions</h3>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 border-red-200 text-red-700">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
            <Button variant="outline" size="sm" className="flex-1 border-red-200 text-red-700">
              <Phone className="h-4 w-4 mr-2" />
              Emergency Call
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}