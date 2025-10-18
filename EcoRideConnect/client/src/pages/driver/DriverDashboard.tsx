import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { DriverStats, Ride } from "@/types/api";

export default function DriverDashboard() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showMenu, setShowMenu] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [femalePref, setFemalePref] = useState(false);

  const { data: stats, isLoading } = useQuery<DriverStats>({
    queryKey: ["/api/driver/stats"],
    enabled: !!user,
  });

  const { data: pendingRides } = useQuery<Ride[]>({
    queryKey: ["/api/driver/pending-rides"],
    enabled: !!user && isAvailable,
    refetchInterval: isAvailable ? 5000 : false,
  });

  const handleToggleAvailability = async (available: boolean) => {
    try {
      await apiRequest("PUT", "/api/driver/availability", { available });
      setIsAvailable(available);
      toast({
        title: available ? "You're Online" : "You're Offline",
        description: available 
          ? "You'll now receive ride requests" 
          : "You won't receive ride requests",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update availability",
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
        {/* Availability Toggle */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Power className="h-5 w-5" />
                <Label htmlFor="availability" className="text-lg font-semibold">
                  Driver Status
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {isAvailable ? "You're online and receiving requests" : "Go online to start earning"}
              </p>
            </div>
            <Switch
              id="availability"
              checked={isAvailable}
              onCheckedChange={handleToggleAvailability}
              data-testid="switch-availability"
              className="data-[state=checked]:bg-status-online"
            />
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid="text-total-earnings">
                  ₹{Number(stats?.totalEarnings || 0).toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Earnings</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid="text-total-rides">
                  {stats?.totalRides || 0}
                </div>
                <div className="text-xs text-muted-foreground">Total Rides</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid="text-rating">
                  {Number(stats?.rating || 5).toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Rating</div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-md">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">₹{Number(stats?.todayEarnings || 0).toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">Today's Earnings</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Female Preference Setting */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="female-pref">Female Rider Preference</Label>
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
        </Card>

        {/* Pending Ride Requests */}
        {isAvailable && pendingRides && pendingRides.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-semibold">Ride Requests</h2>
            {pendingRides.map((ride: any) => (
              <Card key={ride.id} className="p-6 border-2 border-primary animate-pulse">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">New Ride Request</h3>
                      <p className="text-sm text-muted-foreground">{ride.pickupLocation}</p>
                      <p className="text-sm text-muted-foreground">to {ride.dropoffLocation}</p>
                    </div>
                    <Badge>₹{Number(ride.estimatedFare).toFixed(0)}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleAcceptRide(ride.id)}
                      data-testid={`button-accept-ride-${ride.id}`}
                    >
                      Accept Ride
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      data-testid={`button-reject-ride-${ride.id}`}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {isAvailable && (!pendingRides || pendingRides.length === 0) && (
          <Card className="p-12 text-center">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Waiting for Ride Requests</h3>
            <p className="text-sm text-muted-foreground">
              You'll be notified when a rider requests a ride nearby
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
