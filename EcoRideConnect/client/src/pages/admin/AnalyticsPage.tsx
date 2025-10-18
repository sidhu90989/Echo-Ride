import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Car, 
  DollarSign,
  Leaf,
  MapPin,
  Calendar,
  Download,
  Filter,
  Globe,
  Award,
  Target,
  Activity,
  Clock,
  Zap
} from "lucide-react";

interface CityStats {
  city: string;
  rides: number;
  revenue: number;
  users: number;
  drivers: number;
  co2Saved: number;
  growthRate: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  type: 'user' | 'driver' | 'city';
  co2Saved: number;
  rides: number;
  achievement: string;
}

interface MetricData {
  period: string;
  rides: number;
  revenue: number;
  users: number;
  co2Saved: number;
}

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [selectedCity, setSelectedCity] = useState("all");

  // Mock analytics data
  const overallMetrics = {
    totalRides: 245680,
    totalRevenue: 1850420.50,
    totalUsers: 98450,
    totalDrivers: 12380,
    totalCO2Saved: 156780,
    averageRating: 4.8,
    growthRates: {
      rides: 18.5,
      revenue: 22.3,
      users: 15.7,
      drivers: 8.9
    }
  };

  // Mock time series data
  const ridesPerDay: MetricData[] = [
    { period: "Jan 1", rides: 1250, revenue: 8750, users: 890, co2Saved: 425 },
    { period: "Jan 2", rides: 1420, revenue: 9940, users: 920, co2Saved: 485 },
    { period: "Jan 3", rides: 1380, revenue: 9660, users: 905, co2Saved: 472 },
    { period: "Jan 4", rides: 1680, revenue: 11760, users: 1025, co2Saved: 574 },
    { period: "Jan 5", rides: 1850, revenue: 12950, users: 1150, co2Saved: 632 },
    { period: "Jan 6", rides: 1920, revenue: 13440, users: 1180, co2Saved: 656 },
    { period: "Jan 7", rides: 1750, revenue: 12250, users: 1095, co2Saved: 598 }
  ];

  const monthlyRevenue: MetricData[] = [
    { period: "Jul", rides: 35420, revenue: 248940, users: 2850, co2Saved: 12108 },
    { period: "Aug", rides: 38750, revenue: 271250, users: 3120, co2Saved: 13238 },
    { period: "Sep", rides: 42180, revenue: 295260, users: 3450, co2Saved: 14402 },
    { period: "Oct", rides: 45680, revenue: 319760, users: 3780, co2Saved: 15602 },
    { period: "Nov", rides: 48920, revenue: 342440, users: 4085, co2Saved: 16714 },
    { period: "Dec", rides: 52340, revenue: 366380, users: 4420, co2Saved: 17900 }
  ];

  const userGrowth: MetricData[] = [
    { period: "Q1 2023", rides: 89420, revenue: 626940, users: 8950, co2Saved: 30564 },
    { period: "Q2 2023", rides: 112850, revenue: 789950, users: 12340, co2Saved: 38574 },
    { period: "Q3 2023", rides: 145680, revenue: 1019760, users: 16780, co2Saved: 49732 },
    { period: "Q4 2023", rides: 189740, revenue: 1328180, users: 22150, co2Saved: 64830 }
  ];

  // Mock city-wise data
  const cityStats: CityStats[] = [
    { city: "New York", rides: 58420, revenue: 408940, users: 18650, drivers: 2840, co2Saved: 19964, growthRate: 22.5 },
    { city: "Los Angeles", rides: 52180, revenue: 365260, users: 16890, drivers: 2520, co2Saved: 17845, growthRate: 18.7 },
    { city: "Chicago", rides: 38750, revenue: 271250, users: 12450, drivers: 1890, co2Saved: 13238, growthRate: 15.2 },
    { city: "Houston", rides: 32940, revenue: 230580, users: 10680, drivers: 1640, co2Saved: 11262, growthRate: 19.8 },
    { city: "Phoenix", rides: 28450, revenue: 199150, users: 9240, drivers: 1420, co2Saved: 9724, growthRate: 25.3 },
    { city: "Philadelphia", rides: 24680, revenue: 172760, users: 8150, drivers: 1245, co2Saved: 8436, growthRate: 12.8 }
  ];

  // Mock CO₂ leaderboard
  const co2Leaderboard: LeaderboardEntry[] = [
    { rank: 1, name: "EcoWarrior92", type: "user", co2Saved: 2845, rides: 142, achievement: "Green Champion" },
    { rank: 2, name: "Sarah Green", type: "user", co2Saved: 2654, rides: 128, achievement: "Carbon Crusher" },
    { rank: 3, name: "Mike EcoDriver", type: "driver", co2Saved: 2489, rides: 234, achievement: "Electric Master" },
    { rank: 4, name: "New York Hub", type: "city", co2Saved: 19964, rides: 58420, achievement: "Cleanest City" },
    { rank: 5, name: "Emma Climate", type: "user", co2Saved: 2234, rides: 118, achievement: "Sustainability Star" },
    { rank: 6, name: "Alex EcoRider", type: "user", co2Saved: 2156, rides: 104, achievement: "Green Guardian" },
    { rank: 7, name: "David CleanDrive", type: "driver", co2Saved: 2089, rides: 195, achievement: "Eco Driver Pro" },
    { rank: 8, name: "Lisa Planet", type: "user", co2Saved: 1987, rides: 98, achievement: "Earth Defender" }
  ];

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getGrowthColor = (rate: number) => {
    return rate >= 0 ? "text-green-600" : "text-red-600";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'driver':
        return <Car className="h-4 w-4 text-orange-500" />;
      case 'city':
        return <MapPin className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAchievementBadge = (achievement: string) => {
    const colors = {
      "Green Champion": "bg-emerald-100 text-emerald-800",
      "Carbon Crusher": "bg-green-100 text-green-800",
      "Electric Master": "bg-blue-100 text-blue-800",
      "Cleanest City": "bg-purple-100 text-purple-800",
      "Sustainability Star": "bg-yellow-100 text-yellow-800",
      "Green Guardian": "bg-teal-100 text-teal-800",
      "Eco Driver Pro": "bg-indigo-100 text-indigo-800",
      "Earth Defender": "bg-lime-100 text-lime-800"
    };
    
    return (
      <Badge className={colors[achievement as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        <Award className="h-3 w-3 mr-1" />
        {achievement}
      </Badge>
    );
  };

  // Mock chart component since we don't have actual charting library
  const MockChart = ({ data, title, color = "blue" }: { data: MetricData[], title: string, color?: string }) => {
    const maxValue = Math.max(...data.map(d => d.rides || d.revenue || d.users || d.co2Saved));
    
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        <div className="flex items-end gap-2 h-32">
          {data.slice(-7).map((item, index) => {
            const value = item.rides || item.revenue || item.users || item.co2Saved;
            const height = (value / maxValue) * 100;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs text-muted-foreground">{value.toLocaleString()}</div>
                <div 
                  className={`w-full bg-${color}-500 rounded-t opacity-80 hover:opacity-100 transition-opacity`}
                  style={{ height: `${height}%` }}
                  title={`${item.period}: ${value.toLocaleString()}`}
                />
                <div className="text-xs text-muted-foreground">{item.period}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Reporting</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 Days</SelectItem>
              <SelectItem value="30days">30 Days</SelectItem>
              <SelectItem value="90days">90 Days</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallMetrics.totalRides.toLocaleString()}</div>
            <div className={`flex items-center text-xs ${getGrowthColor(overallMetrics.growthRates.rides)}`}>
              {getGrowthIcon(overallMetrics.growthRates.rides)}
              +{overallMetrics.growthRates.rides}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overallMetrics.totalRevenue.toLocaleString()}</div>
            <div className={`flex items-center text-xs ${getGrowthColor(overallMetrics.growthRates.revenue)}`}>
              {getGrowthIcon(overallMetrics.growthRates.revenue)}
              +{overallMetrics.growthRates.revenue}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallMetrics.totalUsers.toLocaleString()}</div>
            <div className={`flex items-center text-xs ${getGrowthColor(overallMetrics.growthRates.users)}`}>
              {getGrowthIcon(overallMetrics.growthRates.users)}
              +{overallMetrics.growthRates.users}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CO₂ Saved</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallMetrics.totalCO2Saved.toLocaleString()} kg</div>
            <div className="text-xs text-green-600">
              <Leaf className="h-3 w-3 mr-1 inline" />
              Environmental impact
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rides">Rides Analytics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
          <TabsTrigger value="users">User Growth</TabsTrigger>
          <TabsTrigger value="environmental">Environmental Impact</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Rides Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Rides Trend</CardTitle>
                <CardDescription>Rides completed per day over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <MockChart data={ridesPerDay} title="Rides per Day" color="blue" />
              </CardContent>
            </Card>

            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Revenue trends over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <MockChart data={monthlyRevenue} title="Revenue per Month" color="green" />
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>Key operational metrics and KPIs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Rating</span>
                  <div className="flex items-center gap-2">
                    <Progress value={overallMetrics.averageRating * 20} className="w-20" />
                    <span className="text-sm font-medium">{overallMetrics.averageRating}/5.0</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Driver Utilization</span>
                  <div className="flex items-center gap-2">
                    <Progress value={78} className="w-20" />
                    <span className="text-sm font-medium">78%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Completion Rate</span>
                  <div className="flex items-center gap-2">
                    <Progress value={94} className="w-20" />
                    <span className="text-sm font-medium">94%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Customer Retention</span>
                  <div className="flex items-center gap-2">
                    <Progress value={87} className="w-20" />
                    <span className="text-sm font-medium">87%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Statistics</CardTitle>
                <CardDescription>Real-time platform metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Avg Wait Time</span>
                    </div>
                    <div className="text-lg font-bold">3.2 min</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Trip Distance</span>
                    </div>
                    <div className="text-lg font-bold">8.5 km</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Active Drivers</span>
                    </div>
                    <div className="text-lg font-bold">2,847</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Activity className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Peak Hours</span>
                    </div>
                    <div className="text-lg font-bold">6-9 PM</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rides Analytics Tab */}
        <TabsContent value="rides">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rides Per Day Analytics</CardTitle>
                <CardDescription>Detailed breakdown of daily ride completion trends</CardDescription>
              </CardHeader>
              <CardContent>
                <MockChart data={ridesPerDay} title="Daily Ride Completions" color="blue" />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ride Categories</CardTitle>
                  <CardDescription>Distribution by ride type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Economy Rides</span>
                      <div className="flex items-center gap-2">
                        <Progress value={65} className="w-20" />
                        <span className="text-sm font-medium">65%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Premium Rides</span>
                      <div className="flex items-center gap-2">
                        <Progress value={20} className="w-20" />
                        <span className="text-sm font-medium">20%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Electric Rides</span>
                      <div className="flex items-center gap-2">
                        <Progress value={12} className="w-20" />
                        <span className="text-sm font-medium">12%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Luxury Rides</span>
                      <div className="flex items-center gap-2">
                        <Progress value={3} className="w-20" />
                        <span className="text-sm font-medium">3%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Peak Hours Analysis</CardTitle>
                  <CardDescription>Ride demand by hour of the day</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { hour: "06:00-09:00", percentage: 85, label: "Morning Rush" },
                      { hour: "12:00-14:00", percentage: 62, label: "Lunch Peak" },
                      { hour: "17:00-20:00", percentage: 95, label: "Evening Rush" },
                      { hour: "22:00-02:00", percentage: 35, label: "Night Hours" },
                      { hour: "02:00-06:00", percentage: 15, label: "Early Morning" }
                    ].map((period, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium">{period.hour}</span>
                          <div className="text-xs text-muted-foreground">{period.label}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={period.percentage} className="w-20" />
                          <span className="text-sm font-medium">{period.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Revenue Analytics Tab */}
        <TabsContent value="revenue">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trends</CardTitle>
                <CardDescription>Revenue performance over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <MockChart data={monthlyRevenue} title="Monthly Revenue" color="green" />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Sources</CardTitle>
                  <CardDescription>Breakdown by revenue streams</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Ride Commissions</span>
                      <div className="flex items-center gap-2">
                        <Progress value={75} className="w-20" />
                        <span className="text-sm font-medium">75%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Premium Features</span>
                      <div className="flex items-center gap-2">
                        <Progress value={15} className="w-20" />
                        <span className="text-sm font-medium">15%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cancellation Fees</span>
                      <div className="flex items-center gap-2">
                        <Progress value={6} className="w-20" />
                        <span className="text-sm font-medium">6%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Other Services</span>
                      <div className="flex items-center gap-2">
                        <Progress value={4} className="w-20" />
                        <span className="text-sm font-medium">4%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Metrics</CardTitle>
                  <CardDescription>Key financial performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Revenue per Ride</span>
                      <span className="text-sm font-medium">$7.53</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Revenue per User</span>
                      <span className="text-sm font-medium">$18.79</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Commission Rate</span>
                      <span className="text-sm font-medium">20%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Net Profit Margin</span>
                      <span className="text-sm font-medium text-green-600">28.5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* User Growth Tab */}
        <TabsContent value="users">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth Analytics</CardTitle>
                <CardDescription>Quarterly user acquisition and retention trends</CardDescription>
              </CardHeader>
              <CardContent>
                <MockChart data={userGrowth} title="User Growth by Quarter" color="purple" />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Demographics</CardTitle>
                  <CardDescription>User distribution by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Regular Riders</span>
                      <div className="flex items-center gap-2">
                        <Progress value={68} className="w-20" />
                        <span className="text-sm font-medium">68%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Drivers</span>
                      <div className="flex items-center gap-2">
                        <Progress value={12} className="w-20" />
                        <span className="text-sm font-medium">12%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">New Users (30 days)</span>
                      <div className="flex items-center gap-2">
                        <Progress value={15} className="w-20" />
                        <span className="text-sm font-medium">15%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Inactive Users</span>
                      <div className="flex items-center gap-2">
                        <Progress value={5} className="w-20" />
                        <span className="text-sm font-medium">5%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                  <CardDescription>User activity and engagement statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Daily Active Users</span>
                      <span className="text-sm font-medium">24,850</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Monthly Active Users</span>
                      <span className="text-sm font-medium">98,450</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Session Duration</span>
                      <span className="text-sm font-medium">12.5 min</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">User Retention (30 days)</span>
                      <span className="text-sm font-medium text-green-600">87%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Environmental Impact Tab */}
        <TabsContent value="environmental">
          <div className="space-y-6">
            {/* CO₂ Savings Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total CO₂ Saved</CardTitle>
                  <Leaf className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{overallMetrics.totalCO2Saved.toLocaleString()} kg</div>
                  <div className="text-xs text-muted-foreground">Equivalent to 340 trees planted</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Electric Rides</CardTitle>
                  <Zap className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">29,450</div>
                  <div className="text-xs text-green-600">12% of total rides</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Green Bonus Points</CardTitle>
                  <Award className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234,567</div>
                  <div className="text-xs text-muted-foreground">Distributed to eco-conscious users</div>
                </CardContent>
              </Card>
            </div>

            {/* CO₂ Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle>CO₂ Savings Leaderboard</CardTitle>
                <CardDescription>Top contributors to environmental sustainability</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>CO₂ Saved</TableHead>
                      <TableHead>Rides</TableHead>
                      <TableHead>Achievement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {co2Leaderboard.map((entry) => (
                      <TableRow key={entry.rank}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              entry.rank <= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {entry.rank}
                            </div>
                            {entry.rank <= 3 && <Award className="h-4 w-4 text-yellow-500" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(entry.type)}
                            <span className="font-medium">{entry.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {entry.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">{entry.co2Saved.toLocaleString()} kg</span>
                        </TableCell>
                        <TableCell>{entry.rides.toLocaleString()}</TableCell>
                        <TableCell>
                          {getAchievementBadge(entry.achievement)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Environmental Programs Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Environmental Programs Impact</CardTitle>
                <CardDescription>Performance of eco-friendly initiatives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Program Participation</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Electric Vehicle Program</span>
                        <div className="flex items-center gap-2">
                          <Progress value={68} className="w-20" />
                          <span className="text-sm font-medium">68%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Carbon Offset Initiative</span>
                        <div className="flex items-center gap-2">
                          <Progress value={45} className="w-20" />
                          <span className="text-sm font-medium">45%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Bike Share Integration</span>
                        <div className="flex items-center gap-2">
                          <Progress value={23} className="w-20" />
                          <span className="text-sm font-medium">23%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Environmental Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">CO₂ per Ride Reduction</span>
                        <span className="text-sm font-medium text-green-600">-24%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Electric Fleet Percentage</span>
                        <span className="text-sm font-medium">15.8%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Renewable Energy Usage</span>
                        <span className="text-sm font-medium">78%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* City-wise Performance */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>City-wise Performance</CardTitle>
              <CardDescription>Active city usage and performance metrics</CardDescription>
            </div>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cityStats.map((city) => (
                  <SelectItem key={city.city} value={city.city.toLowerCase()}>
                    {city.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>City</TableHead>
                <TableHead>Rides</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Drivers</TableHead>
                <TableHead>CO₂ Saved</TableHead>
                <TableHead>Growth Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cityStats.map((city) => (
                <TableRow key={city.city}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">{city.city}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{city.rides.toLocaleString()}</TableCell>
                  <TableCell>${city.revenue.toLocaleString()}</TableCell>
                  <TableCell>{city.users.toLocaleString()}</TableCell>
                  <TableCell>{city.drivers.toLocaleString()}</TableCell>
                  <TableCell className="text-green-600">{city.co2Saved.toLocaleString()} kg</TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1 ${getGrowthColor(city.growthRate)}`}>
                      {getGrowthIcon(city.growthRate)}
                      +{city.growthRate}%
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
