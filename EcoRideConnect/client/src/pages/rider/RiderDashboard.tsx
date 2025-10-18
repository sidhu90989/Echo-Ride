import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VehicleCard } from "@/components/VehicleCard";
import { EcoImpactCard } from "@/components/EcoImpactCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MapPin, Navigation, AlertCircle, Menu, History, Gift, TrendingUp, User, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { RiderStats } from "@/types/api";
import { RideMap, type LatLng } from "@/components/maps/RideMap";

type VehicleType = "e_rickshaw" | "e_scooter" | "cng_car";

export default function RiderDashboard() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showBooking, setShowBooking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>("e_rickshaw");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [femalePref, setFemalePref] = useState(false);
  const [estimatedFares, setEstimatedFares] = useState({
    e_rickshaw: 45,
    e_scooter: 30,
    cng_car: 80,
  });
  const [riderLoc, setRiderLoc] = useState<LatLng | null>(null);
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  const { data: stats, isLoading } = useQuery<RiderStats>({
    queryKey: ["/api/rider/stats"],
    enabled: !!user,
  });

  useEffect(() => {
    let watchId: number | null = null;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setRiderLoc({ lat: latitude, lng: longitude });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
      );
    }
    return () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); };
  }, []);

  const handleBookRide = async () => {
    if (!pickupLocation.trim() || !dropoffLocation.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both pickup and dropoff locations.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/rides", {
        pickupLocation,
        pickupLat: "28.6139",
        pickupLng: "77.2090",
        dropoffLocation,
        dropoffLat: "28.7041",
        dropoffLng: "77.1025",
        vehicleType: selectedVehicle,
        femalePrefRequested: femalePref,
      });

      const ride = await response.json();
      
      toast({
        title: "Ride Requested!",
        description: "Finding a nearby driver for you...",
      });

      setShowBooking(false);
      setLocation(`/rider/ride/${ride.id}`);
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "Could not request ride. Please try again.",
        variant: "destructive",
      });
    }
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
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowMenu(!showMenu)}
            data-testid="button-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-serif text-xl font-bold">EcoRide</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocation("/rider/profile")}
              data-testid="button-profile"
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Side Menu */}
      {showMenu && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowMenu(false)}>
          <div className="absolute left-0 top-0 h-full w-64 bg-card border-r p-6 space-y-6" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-2">
              <h2 className="font-serif font-semibold text-xl">Menu</h2>
              <p className="text-sm text-muted-foreground">Welcome, {user?.name}</p>
            </div>
            <nav className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setShowMenu(false);
                  setLocation("/rider/history");
                }}
                data-testid="link-ride-history"
              >
                <History className="h-5 w-5" />
                Ride History
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setShowMenu(false);
                  setLocation("/rider/rewards");
                }}
                data-testid="link-rewards"
              >
                <Gift className="h-5 w-5" />
                Rewards & Badges
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setShowMenu(false);
                  setLocation("/rider/wallet-offers");
                }}
                data-testid="link-wallet-offers"
              >
                <Gift className="h-5 w-5" />
                Wallet & Offers
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setShowMenu(false);
                  setLocation("/rider/profile");
                }}
                data-testid="link-profile-settings"
              >
                <User className="h-5 w-5" />
                Profile Settings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setShowMenu(false);
                  setLocation("/charging-stations");
                }}
                data-testid="link-charging-stations"
              >
                <MapPin className="h-5 w-5" />
                Charging Stations
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setShowMenu(false);
                  setLocation("/leaderboard");
                }}
                data-testid="link-leaderboard"
              >
                <TrendingUp className="h-5 w-5" />
                Leaderboard
              </Button>
            </nav>
            <div className="pt-6 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                onClick={handleSignOut}
                data-testid="button-signout"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 space-y-6 max-w-7xl mx-auto">
        {/* Eco Impact Summary */}
        {stats && (
          <EcoImpactCard
            co2Saved={Number(stats.totalCO2Saved || 0)}
            ecoPoints={stats.ecoPoints || 0}
            ridesCount={stats.totalRides || 0}
            nextBadgePoints={500}
          />
        )}

        {/* Live Map & Booking */}
        <Card className="overflow-hidden">
          {mapsKey ? (
            <RideMap
              apiKey={mapsKey}
              rider={riderLoc}
              height={256}
            />
          ) : (
            <div className="bg-gradient-to-br from-eco-mint to-eco-mint/50 dark:from-eco-dark-green/20 dark:to-eco-dark-green/10 h-64 flex items-center justify-center border-b">
              <div className="text-center space-y-4">
                <div className="p-4 bg-background/80 backdrop-blur-sm rounded-full inline-block">
                  <MapPin className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif font-semibold text-lg">Interactive Map</h3>
                  <p className="text-sm text-muted-foreground">
                    Add VITE_GOOGLE_MAPS_API_KEY to enable the live map
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-6">
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={() => setShowBooking(true)}
              data-testid="button-book-ride"
            >
              <Navigation className="h-5 w-5" />
              Book a Ride
            </Button>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats?.totalRides || 0}</div>
            <div className="text-xs text-muted-foreground">Total Rides</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats?.ecoPoints || 0}</div>
            <div className="text-xs text-muted-foreground">Eco Points</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {Number(stats?.totalCO2Saved || 0).toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">kg CO₂ Saved</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats?.badgesEarned || 0}</div>
            <div className="text-xs text-muted-foreground">Badges Earned</div>
          </Card>
        </div>

        {/* Safety Notice */}
        <Card className="p-4 bg-sky-blue/10 border-sky-blue/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-sky-blue mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Your Safety Matters</h4>
              <p className="text-xs text-muted-foreground">
                All drivers are verified. Use the SOS button during rides for emergency assistance.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Book Your Eco-Ride</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Locations */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pickup">Pickup Location</Label>
                <Input
                  id="pickup"
                  placeholder="Enter pickup address"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  data-testid="input-pickup"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dropoff">Dropoff Location</Label>
                <Input
                  id="dropoff"
                  placeholder="Enter destination address"
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)}
                  data-testid="input-dropoff"
                />
              </div>
            </div>

            {/* Vehicle Selection */}
            <div className="space-y-3">
              <Label>Select Vehicle Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <VehicleCard
                  type="e_rickshaw"
                  selected={selectedVehicle === "e_rickshaw"}
                  onSelect={() => setSelectedVehicle("e_rickshaw")}
                  estimatedFare={estimatedFares.e_rickshaw}
                  eta={5}
                />
                <VehicleCard
                  type="e_scooter"
                  selected={selectedVehicle === "e_scooter"}
                  onSelect={() => setSelectedVehicle("e_scooter")}
                  estimatedFare={estimatedFares.e_scooter}
                  eta={3}
                />
                <VehicleCard
                  type="cng_car"
                  selected={selectedVehicle === "cng_car"}
                  onSelect={() => setSelectedVehicle("cng_car")}
                  estimatedFare={estimatedFares.cng_car}
                  eta={7}
                />
              </div>
            </div>

            {/* Female Preference */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-md">
              <div className="space-y-0.5">
                <Label htmlFor="female-pref">Female Driver Preference</Label>
                <p className="text-xs text-muted-foreground">Request a female driver for added comfort</p>
              </div>
              <Switch
                id="female-pref"
                checked={femalePref}
                onCheckedChange={setFemalePref}
                data-testid="switch-female-pref"
              />
            </div>

            {/* Booking Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleBookRide}
              data-testid="button-confirm-booking"
            >
              Confirm Booking - ₹{estimatedFares[selectedVehicle]}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
