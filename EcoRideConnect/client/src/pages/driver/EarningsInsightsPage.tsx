import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Clock,
  Car,
  Leaf,
  Gift,
  Users,
  Share2,
  Award,
  Target,
  Zap,
  Star,
  MapPin,
  Timer,
  Fuel,
  Shield,
  ChevronRight,
  Download,
  Eye,
  Filter
} from "lucide-react";
import { useLocation } from "wouter";

interface EarningsData {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  todayRides: number;
  weekRides: number;
  monthRides: number;
  totalRides: number;
  ecoBonus: number;
  referralBonus: number;
  avgRating: number;
  co2Saved: number;
}

interface TripSummary {
  id: string;
  date: string;
  time: string;
  pickup: string;
  drop: string;
  distance: number;
  duration: number;
  fare: number;
  ecoBonus: number;
  rating: number;
  vehicleType: string;
}

export default function EarningsInsightsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Mock earnings data
  const earningsData: EarningsData = {
    today: 1250,
    thisWeek: 8750,
    thisMonth: 35200,
    total: 125800,
    todayRides: 8,
    weekRides: 45,
    monthRides: 180,
    totalRides: 842,
    ecoBonus: 2400,
    referralBonus: 1500,
    avgRating: 4.8,
    co2Saved: 245.6
  };

  // Mock trip data
  const recentTrips: TripSummary[] = [
    {
      id: "trip_001",
      date: "Today",
      time: "2:30 PM",
      pickup: "Phoenix Mall",
      drop: "Electronic City",
      distance: 18.5,
      duration: 35,
      fare: 320,
      ecoBonus: 25,
      rating: 5,
      vehicleType: "sedan"
    },
    {
      id: "trip_002",
      date: "Today",
      time: "12:15 PM",
      pickup: "HSR Layout",
      drop: "Koramangala",
      distance: 8.2,
      duration: 22,
      fare: 180,
      ecoBonus: 15,
      rating: 4,
      vehicleType: "hatchback"
    },
    {
      id: "trip_003",
      date: "Yesterday",
      time: "6:45 PM",
      pickup: "Whitefield",
      drop: "Indiranagar",
      distance: 22.3,
      duration: 45,
      fare: 450,
      ecoBonus: 35,
      rating: 5,
      vehicleType: "sedan"
    }
  ];

  const dailyEarnings = [
    { day: 'Mon', amount: 850, rides: 6 },
    { day: 'Tue', amount: 1200, rides: 8 },
    { day: 'Wed', amount: 980, rides: 7 },
    { day: 'Thu', amount: 1450, rides: 10 },
    { day: 'Fri', amount: 1650, rides: 12 },
    { day: 'Sat', amount: 1820, rides: 14 },
    { day: 'Sun', amount: 1300, rides: 9 }
  ];

  const maxEarning = Math.max(...dailyEarnings.map(d => d.amount));

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
          <h1 className="font-serif text-xl font-bold">Earnings & Insights</h1>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-700">₹{earningsData.today}</div>
                <div className="text-xs text-green-600">Today's Earnings</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Car className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700">{earningsData.todayRides}</div>
                <div className="text-xs text-blue-600">Rides Today</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Leaf className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-700">₹{earningsData.ecoBonus}</div>
                <div className="text-xs text-orange-600">Eco Bonus</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-700">{earningsData.avgRating}</div>
                <div className="text-xs text-purple-600">Average Rating</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Earnings Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Weekly Earnings Overview
            </h2>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </div>

          {/* Chart */}
          <div className="space-y-4">
            {dailyEarnings.map((day, index) => (
              <div key={day.day} className="flex items-center gap-4">
                <div className="w-12 text-sm font-medium text-muted-foreground">
                  {day.day}
                </div>
                <div className="flex-1 relative">
                  <div className="bg-gray-200 dark:bg-gray-700 h-8 rounded-lg overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-lg flex items-center justify-end pr-3 transition-all duration-1000 ease-out"
                      style={{ width: `${(day.amount / maxEarning) * 100}%` }}
                    >
                      <span className="text-white text-xs font-medium">
                        ₹{day.amount}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-16 text-sm text-muted-foreground text-right">
                  {day.rides} rides
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">₹{earningsData.thisWeek}</div>
              <div className="text-sm text-muted-foreground">This Week</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{earningsData.weekRides}</div>
              <div className="text-sm text-muted-foreground">Rides</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">₹{Math.round(earningsData.thisWeek / earningsData.weekRides)}</div>
              <div className="text-sm text-muted-foreground">Avg/Ride</div>
            </div>
          </div>
        </Card>

        {/* Eco Impact & Bonuses */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Leaf className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold">Eco Impact</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">CO₂ Saved</span>
                <span className="text-xl font-bold text-green-600">{earningsData.co2Saved} kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Eco Bonus Earned</span>
                <span className="text-xl font-bold text-green-600">₹{earningsData.ecoBonus}</span>
              </div>
              <Separator />
              <div className="text-center py-4">
                <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-green-700">Eco Champion</div>
                <div className="text-xs text-green-600">Top 10% eco-friendly drivers</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Gift className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold">Referral Program</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Referrals Made</span>
                <span className="text-xl font-bold text-blue-600">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Bonus Earned</span>
                <span className="text-xl font-bold text-blue-600">₹{earningsData.referralBonus}</span>
              </div>
              <Separator />
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Share2 className="h-4 w-4 mr-2" />
                Invite More Drivers
              </Button>
            </div>
          </Card>
        </div>

        {/* Trip Summary */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              Recent Trips
            </h2>
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="space-y-4">
            {recentTrips.map((trip) => (
              <div key={trip.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {trip.date}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{trip.time}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="font-medium">From:</span> {trip.pickup}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        <span className="font-medium">To:</span> {trip.drop}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">₹{trip.fare}</div>
                    {trip.ecoBonus > 0 && (
                      <div className="text-xs text-orange-600">+₹{trip.ecoBonus} eco</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {trip.distance} km
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      {trip.duration} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {trip.vehicleType}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < trip.rating 
                            ? 'text-yellow-500 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Performance Insights */}
        <Card className="p-6">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <Target className="h-6 w-6 text-primary" />
            Performance Insights
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <div className="text-2xl font-bold text-green-600">+23%</div>
              <div className="text-sm text-muted-foreground">Earnings vs Last Month</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">4.2</div>
              <div className="text-sm text-muted-foreground">Avg Trips per Hour</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">98%</div>
              <div className="text-sm text-muted-foreground">Acceptance Rate</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}