import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Users,
  Car,
  DollarSign,
  Leaf,
  TrendingUp,
  TrendingDown,
  MapPin,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import type { AdminStats, Ride } from "@/types/api";

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: activeRides } = useQuery<Ride[]>({
    queryKey: ["/api/admin/active-rides"],
    refetchInterval: 5000,
  });

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
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="font-serif text-2xl font-bold">EcoRide Admin</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              onClick={handleSignOut}
              data-testid="button-signout"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Users</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold" data-testid="text-total-users">
                    {stats?.totalUsers || 0}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12%
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Active Drivers</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold" data-testid="text-active-drivers">
                    {stats?.activeDrivers || 0}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +8%
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Car className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold" data-testid="text-total-revenue">
                    ₹{Number(stats?.totalRevenue || 0).toLocaleString()}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +15%
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-eco-mint dark:bg-eco-dark-green/20">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">CO₂ Saved</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold text-primary" data-testid="text-total-co2">
                    {Number(stats?.totalCO2Saved || 0).toFixed(0)} kg
                  </h3>
                </div>
              </div>
              <div className="p-3 bg-primary/20 rounded-full">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-serif text-lg font-semibold mb-4">Rides Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Today's Rides</span>
                <span className="font-semibold">{stats?.todayRides || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Week</span>
                <span className="font-semibold">{stats?.weekRides || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="font-semibold">{stats?.monthRides || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Rides</span>
                <span className="font-semibold">{stats?.totalRides || 0}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-serif text-lg font-semibold mb-4">Vehicle Distribution</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">E-Rickshaw</span>
                  <span className="text-sm font-semibold">{stats?.vehicleStats?.e_rickshaw || 0}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "45%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">E-Scooter</span>
                  <span className="text-sm font-semibold">{stats?.vehicleStats?.e_scooter || 0}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "30%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">CNG Car</span>
                  <span className="text-sm font-semibold">{stats?.vehicleStats?.cng_car || 0}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "25%" }} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Active Rides */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-lg font-semibold">Active Rides</h3>
            <Badge variant="secondary">{activeRides?.length || 0} Active</Badge>
          </div>

          {activeRides && activeRides.length > 0 ? (
            <div className="space-y-4">
              {activeRides.map((ride: any) => (
                <div
                  key={ride.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg"
                  data-testid={`active-ride-${ride.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{ride.pickupLocation}</p>
                      <p className="text-sm text-muted-foreground">to {ride.dropoffLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className="bg-primary/20 text-primary">
                      {ride.status === "in_progress" ? "In Progress" : "Accepted"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {ride.vehicleType.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No active rides at the moment
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-20"
            onClick={() => setLocation("/admin/users")}
            data-testid="button-manage-users"
          >
            <Users className="h-5 w-5 mr-2" />
            Manage Users
          </Button>
          <Button
            variant="outline"
            className="h-20"
            onClick={() => setLocation("/admin/drivers")}
            data-testid="button-manage-drivers"
          >
            <Car className="h-5 w-5 mr-2" />
            Manage Drivers
          </Button>
          <Button
            variant="outline"
            className="h-20"
            onClick={() => setLocation("/admin/analytics")}
            data-testid="button-analytics"
          >
            <TrendingUp className="h-5 w-5 mr-2" />
            View Analytics
          </Button>
        </div>
      </div>
    </div>
  );
}
