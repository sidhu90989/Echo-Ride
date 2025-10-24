import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VehicleCard } from "@/components/VehicleCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  MapPin, 
  Navigation, 
  AlertCircle, 
  Menu, 
  History, 
  Gift, 
  TrendingUp, 
  User, 
  LogOut,
  Wallet,
  HelpCircle,
  Target,
  Car,
  Zap,
  Fuel,
  Clock,
  IndianRupee,
  Phone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { RiderStats } from "@/types/api";
import MapComponent from "@/components/MapComponent";
import type { LatLngLike as LatLng } from "@/utils/mapUtils";
import { useAvailableDriversNear } from "@/hooks/useAvailableDriversNear";

type VehicleType = "e_rickshaw" | "e_scooter" | "cng_car";

export default function RiderDashboard() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showBooking, setShowBooking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>("e_rickshaw");
  const [pickupLocation, setPickupLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [estimatedFares] = useState({
    e_rickshaw: 25,
    e_scooter: 30,
    cng_car: 80,
  });
  const [riderLoc, setRiderLoc] = useState<LatLng | null>(null);
  const [currentLocation, setCurrentLocation] = useState<string>("Detecting location...");
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>("cng_car");
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  const { data: stats, isLoading } = useQuery<RiderStats>({
    queryKey: ["/api/rider/stats"],
    enabled: !!user,
  });

  // Vehicle options with comprehensive details
  const vehicleOptions = [
    {
      id: "cng_car" as VehicleType,
      name: "CNG Car",
      icon: Car,
      fare: 80,
      eta: 7,
      capacity: "4 seats",
      description: "Comfortable CNG car for longer distances"
    },
    {
      id: "e_rickshaw" as VehicleType,
      name: "E-Rickshaw",
      icon: Zap,
      fare: 25,
      eta: 3,
      capacity: "3 seats",
      description: "Electric rickshaw for local travel"
    },
    {
      id: "e_scooter" as VehicleType,
      name: "E-Scooter",
      icon: Target,
      fare: 30,
      eta: 5,
      capacity: "2 seats",
      description: "Quick electric scooter rides"
    }
  ];

  // Mock rider stats
  const mockStats: RiderStats = {
    totalRides: 127,
    badgesEarned: 3,
  };

  const handleBookRide = () => {
    if (!pickupLocation.trim() || !destination.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both pickup location and destination",
        variant: "destructive"
      });
      return;
    }

    // Navigate to confirm ride page
    setLocation("/rider/confirm");
  };

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowMenu(!showMenu)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-serif text-xl font-bold">RideConnect</h1>
              <p className="text-xs text-muted-foreground">Reliable rides, anytime</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLocation("/rider/wallet")}
            >
              <Wallet className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLocation("/rider/rewards")}
            >
              <Gift className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLocation("/rider/profile")}
            >
              <User className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Navigation Menu */}
        {showMenu && (
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="ghost" 
                className="justify-start h-auto p-4"
                onClick={() => {
                  setLocation("/rider/history");
                  setShowMenu(false);
                }}
              >
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    <span className="font-medium">Ride History</span>
                  </div>
                  <span className="text-xs text-muted-foreground">View past rides</span>
                </div>
              </Button>
              
              <Button 
                variant="ghost" 
                className="justify-start h-auto p-4"
                onClick={() => {
                  setLocation("/rider/rewards");
                  setShowMenu(false);
                }}
              >
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    <span className="font-medium">Rewards</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Earn points</span>
                </div>
              </Button>
              
              <Button 
                variant="ghost" 
                className="justify-start h-auto p-4"
                onClick={() => {
                  setLocation("/rider/wallet-offers");
                  setShowMenu(false);
                }}
              >
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span className="font-medium">Wallet & Offers</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Payment & deals</span>
                </div>
              </Button>
              
              <Button 
                variant="ghost" 
                className="justify-start h-auto p-4"
                onClick={() => {
                  setLocation("/rider/profile");
                  setShowMenu(false);
                }}
              >
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Profile</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Account settings</span>
                </div>
              </Button>
              
              <Button 
                variant="ghost" 
                className="justify-start h-auto p-4"
                onClick={() => {
                  setLocation("/charging-stations");
                  setShowMenu(false);
                }}
              >
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span className="font-medium">Charging Stations</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Find nearby stations</span>
                </div>
              </Button>
              
              <Button 
                variant="ghost" 
                className="justify-start h-auto p-4"
                onClick={() => {
                  setLocation("/leaderboard");
                  setShowMenu(false);
                }}
              >
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">Leaderboard</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Top riders</span>
                </div>
              </Button>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleSignOut}
                data-testid="button-signout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </Card>
        )}

        {/* Quick Booking */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-6 w-6 text-primary" />
            <h2 className="font-serif text-xl font-semibold">Book Your Ride</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pickup">From</Label>
              <Input
                id="pickup"
                placeholder="Enter pickup location"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="destination">To</Label>
              <Input
                id="destination"
                placeholder="Enter destination"
                value={destination}  
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleBookRide}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Find Rides
            </Button>
          </div>
        </Card>

        {/* Vehicle Options */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-semibold">Choose Your Ride</h3>
          <div className="grid grid-cols-1 gap-4">
            {vehicleOptions.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                type={vehicle.id}
                selected={selectedVehicleType === vehicle.id}
                onSelect={() => setSelectedVehicleType(vehicle.id)}
                estimatedFare={vehicle.fare}
                eta={vehicle.eta}
              />
            ))}
          </div>
        </div>

        {/* Map Integration */}
        {mapsKey && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold">Nearby Vehicles</h3>
              <Badge variant="secondary">
                <Car className="h-3 w-3 mr-1" />
                12 available
              </Badge>
            </div>
            <div className="h-80 rounded-lg overflow-hidden">
              <RiderMapBlock center={riderLoc || { lat: 28.6139, lng: 77.2090 }} />
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" size="lg" onClick={() => setLocation("/rider/history")}>
            <History className="h-4 w-4 mr-2" />
            Recent Trips
          </Button>
          <Button variant="outline" size="lg" onClick={() => setLocation("/rider/wallet")}>
            <Wallet className="h-4 w-4 mr-2" />
            Payments
          </Button>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Your Ride</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Vehicle Type</Label>
              <div className="mt-2 space-y-2">
                {vehicleOptions.map((vehicle) => {
                  const IconComponent = vehicle.icon;
                  return (
                    <div
                      key={vehicle.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedVehicle === vehicle.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedVehicle(vehicle.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5" />
                          <div>
                            <div className="font-medium">{vehicle.name}</div>
                            <div className="text-sm text-muted-foreground">{vehicle.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">₹{vehicle.fare}</div>
                          <div className="text-sm text-muted-foreground">{vehicle.eta}min</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowBooking(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleBookRide} className="flex-1">
                Confirm Booking
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RiderMapBlock({ center }: { center: LatLng }) {
  const drivers = useAvailableDriversNear(center, 900, 15000);
  return (
    <div style={{ height: 320 }}>
      <MapComponent
        pickup={center}
        drawRoute={false}
        drivers={drivers}
      />
    </div>
  );
}