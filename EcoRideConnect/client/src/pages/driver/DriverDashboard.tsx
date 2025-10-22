import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  DollarSign, 
  TrendingUp, 
  Star, 
  Car, 
  Power,
  Menu,
  LogOut,
  History,
  FileText,
  Settings,
  MapPin,
  Navigation,
  Clock,
  CheckCircle,
  X,
  Phone,
  MessageCircle,
  Target,
  Calendar,
  BarChart3,
  UserCheck,
  Award,
  Bell,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import MapComponent from "@/components/MapComponent";
import type { LatLngLike as LatLng } from "@/utils/mapUtils";
import type { DriverStats, Ride } from "@/types/api";

export default function DriverDashboard() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showMenu, setShowMenu] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [femalePref, setFemalePref] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [newRideRequest, setNewRideRequest] = useState<Ride | null>(null);
  const [showRideRequest, setShowRideRequest] = useState(false);

  // Enhanced stats with daily earnings
  const todayStats = {
    ridesCompleted: 8,
    earnings: 1250,
    hoursOnline: 6.5,
    rating: 4.8,
    co2Saved: 12.4,
    ecoBonus: 85
  };

  const { data: stats, isLoading } = useQuery<DriverStats>({
    queryKey: ["/api/driver/stats"],
    enabled: !!user,
  });

  const { data: pendingRides } = useQuery<Ride[]>({
    queryKey: ["/api/driver/pending-rides"],
    enabled: !!user && isAvailable,
    refetchInterval: isAvailable ? 5000 : false,
  });

  // Mock nearby ride requests
  const nearbyRequests = [
    {
      id: "1",
      pickupLocation: "Connaught Place",
      dropoffLocation: "Khan Market",
      distance: "2.4 km",
      fare: 45,
      estimatedDuration: "8 min",
      riderRating: 4.6,
      pickupLat: 28.6315,
      pickupLng: 77.2167
    },
    {
      id: "2", 
      pickupLocation: "India Gate",
      dropoffLocation: "Hauz Khas",
      distance: "5.2 km",
      fare: 120,
      estimatedDuration: "15 min",
      riderRating: 4.9,
      pickupLat: 28.6129,
      pickupLng: 77.2295
    }
  ];

  // Location tracking
  useEffect(() => {
    if (isAvailable && "geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Location error:", error);
        },
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isAvailable]);

  // Simulate new ride request notifications
  useEffect(() => {
    if (isAvailable && pendingRides && pendingRides.length > 0) {
      const latestRide = pendingRides[0];
      if (latestRide.id !== newRideRequest?.id) {
        setNewRideRequest(latestRide);
        setShowRideRequest(true);
        
        // Play notification sound (in real app)
        toast({
          title: "🚗 New Ride Request!",
          description: `${latestRide.pickupLocation} → ${latestRide.dropoffLocation}`,
        });
      }
    }
  }, [pendingRides, isAvailable, newRideRequest?.id]);

  const handleToggleAvailability = async (available: boolean) => {
    try {
      await apiRequest("PUT", "/api/driver/availability", { available });
      setIsAvailable(available);
      
      if (available) {
        // Start location tracking when going online
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          }
        );
      }
      
      toast({
        title: available ? "✅ You're now online!" : "⏸️ You're now offline",
        description: available 
          ? "📱 You'll start receiving ride requests from nearby riders."
          : "🚫 You won't receive any new ride requests until you go online.",
      });
    } catch (error) {
      toast({
        title: "❌ Status Update Failed",
        description: "Could not update your availability status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    try {
      await apiRequest("POST", `/api/rides/${rideId}/accept`, {});
      toast({
        title: "Ride Accepted!",
        description: "Navigate to pickup location",
      });
      setLocation(`/driver/ride/${rideId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept ride",
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
          <h1 className="font-serif text-xl font-bold">Driver Dashboard</h1>
          <ThemeToggle />
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
                  setLocation("/driver");
                }}
                data-testid="link-dashboard"
              >
                <TrendingUp className="h-5 w-5" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setShowMenu(false);
                  setLocation("/driver/earnings");
                }}
                data-testid="link-earnings"
              >
                <DollarSign className="h-5 w-5" />
                Earnings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setShowMenu(false);
                  setLocation("/driver/profile");
                }}
                data-testid="link-profile-verification"
              >
                <FileText className="h-5 w-5" />
                Profile & KYC
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
                <Star className="h-5 w-5" />
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
        {/* Driver Availability Toggle */}
        {/* Enhanced Status Toggle */}
        <Card className="p-6 border-2 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <Label htmlFor="availability" className="text-xl font-bold">
                  {isAvailable ? "🟢 ONLINE" : "🔴 OFFLINE"}
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {isAvailable ? "Ready to receive ride requests" : "Go online to start earning"}
              </p>
              {currentLocation && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Location updated
                </p>
              )}
            </div>
            <div className="flex flex-col items-center gap-2">
              <Switch
                id="availability"
                checked={isAvailable}
                onCheckedChange={handleToggleAvailability}
                data-testid="switch-availability"
                className="data-[state=checked]:bg-green-500 scale-125"
              />
              <span className="text-xs font-medium">
                {isAvailable ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </Card>

        {/* Today's Performance Dashboard */}
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Today's Performance
            </h2>
            <Button variant="outline" size="sm" className="text-xs">
              View Details
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary" data-testid="today-rides">
                {todayStats.ridesCompleted}
              </div>
              <div className="text-xs text-muted-foreground">Rides</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600" data-testid="today-earnings">
                ₹{todayStats.earnings}
              </div>
              <div className="text-xs text-muted-foreground">Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600" data-testid="today-hours">
                {todayStats.hoursOnline}h
              </div>
              <div className="text-xs text-muted-foreground">Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600" data-testid="eco-bonus">
                ₹{todayStats.ecoBonus}
              </div>
              <div className="text-xs text-muted-foreground">Eco Bonus</div>
            </div>
          </div>
        </Card>

        {/* Map View & Nearby Requests */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Nearby Ride Requests
            </h2>
            {isAvailable && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Searching for rides...
              </div>
            )}
          </div>
          <div className="relative bg-muted rounded-lg overflow-hidden" style={{ height: '300px' }}>
            {isAvailable ? (
              <div style={{ height: 300 }}>
                <MapComponent
                  pickup={currentLocation || undefined}
                  drawRoute={false}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
                <div className="text-center space-y-2">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-gray-500">Go online to see nearby requests</p>
                  <Button onClick={() => handleToggleAvailability(true)} className="mt-2">
                    Go Online
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Overall Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid="text-total-earnings">
                  ₹{Number(stats?.totalEarnings || 0).toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Earnings</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Car className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid="text-total-rides">
                  {stats?.totalRides || 0}
                </div>
                <div className="text-xs text-muted-foreground">Total Rides</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid="text-rating">
                  {Number(stats?.rating || 5).toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Rating</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">₹{Number(todayStats?.ecoBonus || 0).toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">Eco Bonus</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Driver Preferences */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Driver Preferences
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="female-pref" className="font-medium">Female Rider Preference</Label>
                <p className="text-xs text-muted-foreground">
                  Only receive ride requests from female riders
                </p>
              </div>
              <Switch
                id="female-pref"
                checked={femalePref}
                onCheckedChange={setFemalePref}
                data-testid="switch-female-pref"
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-medium">Ride Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified about nearby ride requests
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-medium">Auto-Accept Short Rides</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically accept rides under 2km
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </Card>

        {/* Incoming Ride Requests from Riders */}
        {isAvailable && pendingRides && pendingRides.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-semibold">🚗 Incoming Ride Requests</h2>
            <p className="text-sm text-muted-foreground">Riders are requesting rides - accept to start earning!</p>
            {pendingRides.map((ride: any) => (
              <Card key={ride.id} className="p-6 border-2 border-primary animate-pulse">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">👤 Rider Request</h3>
                      <p className="text-sm text-muted-foreground">📍 Pickup: {ride.pickupLocation}</p>
                      <p className="text-sm text-muted-foreground">🏁 Dropoff: {ride.dropoffLocation}</p>
                      <p className="text-xs text-muted-foreground">🚙 Vehicle: {ride.vehicleType.replace('_', ' ')}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">₹{Number(ride.estimatedFare).toFixed(0)}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleAcceptRide(ride.id)}
                      data-testid={`button-accept-ride-${ride.id}`}
                    >
                      ✅ Accept Ride
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      data-testid={`button-reject-ride-${ride.id}`}
                    >
                      ❌ Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Waiting for Riders */}
        {isAvailable && (!pendingRides || pendingRides.length === 0) && (
          <Card className="p-12 text-center">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">🔍 Looking for Riders</h3>
            <p className="text-sm text-muted-foreground">
              You're online and ready to receive ride requests from riders in your area
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              💡 Tip: Make sure your location is enabled for better ride matching
            </div>
          </Card>
        )}

        {/* Offline State */}
        {!isAvailable && (
          <Card className="p-12 text-center bg-muted/20">
            <Power className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">You're Offline</h3>
            <p className="text-sm text-muted-foreground">
              Switch on "Driver Status" above to start receiving ride requests from riders
            </p>
          </Card>
        )}
      </div>

      {/* New Ride Request Notification Modal */}
      {showRideRequest && newRideRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white dark:bg-gray-900 border-2 border-primary shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="p-6 space-y-4">
              {/* Header with notification sound indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <h2 className="text-xl font-bold text-primary">🚗 New Ride Request!</h2>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Bell className="h-3 w-3" />
                  <span>30s</span>
                </div>
              </div>

              {/* Ride Details */}
              <div className="space-y-3 bg-muted/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Rider #{newRideRequest.id.slice(-4)}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="font-medium">Pickup:</span> {newRideRequest.pickupLocation}
                      </p>
                      <p className="flex items-center gap-1">
                        <Navigation className="h-3 w-3" />
                        <span className="font-medium">Drop:</span> {newRideRequest.dropoffLocation}
                      </p>
                      <p className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">Distance:</span> 5.2 km
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ₹{newRideRequest.estimatedFare}
                    </div>
                    <div className="text-xs text-muted-foreground">Estimated</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 hover:bg-red-50 hover:border-red-200"
                  onClick={() => {
                    setShowRideRequest(false);
                    setNewRideRequest(null);
                    toast({
                      title: "Ride Declined",
                      description: "Looking for more ride requests...",
                    });
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Decline
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setShowRideRequest(false);
                    setNewRideRequest(null);
                    toast({
                      title: "Ride Accepted! 🎉",
                      description: "Navigate to pickup location to start the trip",
                    });
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Ride
                </Button>
              </div>

              {/* Auto-decline timer */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Auto-decline in <span className="font-medium text-red-500">30s</span>
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                  <div className="bg-red-500 h-1 rounded-full w-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
