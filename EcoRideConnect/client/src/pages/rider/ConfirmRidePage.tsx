import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Leaf, 
  CreditCard, 
  Smartphone,
  Wallet,
  Banknote,
  CheckCircle
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import MapComponent from "@/components/MapComponent";
import { useAvailableDriversNear } from "@/hooks/useAvailableDriversNear";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAppWebSocket } from "@/hooks/useAppWebSocket";

interface Driver {
  id: string;
  name: string;
  rating: number;
  vehicleNumber: string;
  estimatedArrival: number;
  profileImage?: string;
  vehicleType: string;
  fare: number;
}

export default function ConfirmRidePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("upi");
  const [searching, setSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [rideId, setRideId] = useState<string>("");

  // Mock ride data - in real app, this would come from route params
  const rideData = {
    pickup: "Current Location",
    dropoff: "MG Road Metro Station",
    distance: "4.2 km",
    duration: "12 min",
    co2Saved: "1.2 kg"
  };

  const pickup = { lat: 28.6139, lng: 77.2090 };
  const dropoff = { lat: 28.7041, lng: 77.1025 };
  const drivers = useAvailableDriversNear(pickup, 900, 15000);

  // Load available drivers from API (real data)
  function fareFor(vehicleType: string) {
    switch (vehicleType) {
      case "e_scooter": return 30;
      case "e_rickshaw": return 45;
      case "cng_car": return 80;
      default: return 45;
    }
  }

  const { data: apiDrivers, isLoading } = useQuery<
    Array<{
      id: string;
      name: string;
      rating: string | number;
      vehicleNumber: string | null;
      vehicleType: "e_rickshaw" | "e_scooter" | "cng_car";
      estimatedArrival: number;
      fare?: number;
    }>
  >({
    queryKey: ["/api/rider/available-drivers"],
  });

  const availableDrivers: Driver[] = (apiDrivers || []).map((d) => ({
    id: d.id,
    name: d.name,
    rating: typeof d.rating === "string" ? parseFloat(d.rating) : d.rating,
    vehicleNumber: d.vehicleNumber || "PENDING",
    estimatedArrival: d.estimatedArrival ?? 3,
    vehicleType: d.vehicleType,
    fare: typeof d.fare === "number" ? d.fare : fareFor(d.vehicleType),
  }));

  // Listen for ride acceptance/timeout over WebSocket
  useAppWebSocket((msg) => {
    if (!rideId) return;
    if (msg.type === "ride_accepted" && msg.rideId === rideId) {
      toast({ title: "Driver found!", description: "Connecting you to your driver." });
      setLocation(`/rider/ride/${rideId}`);
    }
    if (msg.type === "ride_timeout" && msg.rideId === rideId) {
      setSearching(false);
      setSearchProgress(0);
      setRideId("");
      toast({ title: "No drivers available", description: "Please try again in a moment.", variant: "destructive" });
    }
  });

  const handleConfirmRide = async () => {
    // For now, require a selection to infer vehicle type; could default to e_rickshaw otherwise
    const vehicleType =
      availableDrivers.find((d) => d.id === selectedDriver)?.vehicleType || "e_rickshaw";

    setSearching(true);
    setSearchProgress(0);
    try {
      const res = await apiRequest("POST", "/api/rides", {
        pickupLocation: rideData.pickup,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffLocation: rideData.dropoff,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        vehicleType,
        femalePrefRequested: false,
      });
      const data = await res.json();
      if (data?.id) setRideId(data.id);
    } catch (e: any) {
      setSearching(false);
      toast({ title: "Failed to request ride", description: e?.message || String(e), variant: "destructive" });
      return;
    }

    // Progress UI ticking while searching
    const start = Date.now();
    const total = 30_000; // 30s
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / total) * 100));
      setSearchProgress(pct);
      if (pct >= 100) clearInterval(interval);
    }, 300);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (searching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4 text-center">
          <div className="space-y-6">
            <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <div className="space-y-2">
              <h3 className="font-serif text-xl font-semibold">Finding your driver...</h3>
              <p className="text-sm text-muted-foreground">
                Connecting you with the best available driver
              </p>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${searchProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground">{searchProgress}% Complete</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="flex items-center gap-4 px-4 py-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/rider")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-serif text-xl font-bold">Confirm Ride</h1>
        </div>
      </header>

      <div className="space-y-6">
        {/* Route Map */}
        <div className="h-64 relative">
          <MapComponent
            pickup={pickup}
            drop={dropoff}
            drawRoute={true}
            drivers={drivers}
            style={{ height: 256 }}
          />
          
          {/* Route Info Overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <Card className="p-4 bg-background/95 backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{rideData.distance} • {rideData.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <Leaf className="h-4 w-4" />
                  <span>{rideData.co2Saved} CO₂ saved</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Route Details */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium">{rideData.pickup}</p>
                  <p className="text-sm text-muted-foreground">Pickup location</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium">{rideData.dropoff}</p>
                  <p className="text-sm text-muted-foreground">Drop-off location</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Eco Tip */}
          <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <Leaf className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-200">EcoRide Impact</h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  This ride will save {rideData.co2Saved} of CO₂ compared to a regular taxi! 
                  You're helping make our city cleaner. 🌱
                </p>
              </div>
            </div>
          </Card>

          {/* Available Drivers */}
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold">Available Drivers</h2>
            <RadioGroup value={selectedDriver} onValueChange={setSelectedDriver}>
              {availableDrivers.length === 0 && (
                <Card className="p-4 text-center text-muted-foreground">No drivers are currently available.</Card>
              )}
              {availableDrivers.map((driver) => (
                <div key={driver.id} className="space-y-0">
                  <Card className={`p-4 cursor-pointer transition-all ${
                    selectedDriver === driver.id ? 'ring-2 ring-primary border-primary' : ''
                  }`}>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={driver.id} id={driver.id} />
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        <span className="font-semibold text-lg">
                          {driver.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{driver.name}</h3>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{driver.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{driver.vehicleType}</span>
                          <span>{driver.vehicleNumber}</span>
                          <span>{driver.estimatedArrival} min away</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">₹{driver.fare}</div>
                        <div className="text-xs text-muted-foreground">Fare</div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold">Payment Method</h2>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="grid grid-cols-2 gap-3">
                <Card className={`p-3 cursor-pointer transition-all ${
                  paymentMethod === 'upi' ? 'ring-2 ring-primary border-primary' : ''
                }`}>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="upi" id="upi" />
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-blue-600" />
                      <Label htmlFor="upi" className="font-medium">UPI</Label>
                    </div>
                  </div>
                </Card>
                
                <Card className={`p-3 cursor-pointer transition-all ${
                  paymentMethod === 'wallet' ? 'ring-2 ring-primary border-primary' : ''
                }`}>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="wallet" id="wallet" />
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-green-600" />
                      <Label htmlFor="wallet" className="font-medium">Wallet</Label>
                    </div>
                  </div>
                </Card>
                
                <Card className={`p-3 cursor-pointer transition-all ${
                  paymentMethod === 'card' ? 'ring-2 ring-primary border-primary' : ''
                }`}>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="card" id="card" />
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      <Label htmlFor="card" className="font-medium">Card</Label>
                    </div>
                  </div>
                </Card>
                
                <Card className={`p-3 cursor-pointer transition-all ${
                  paymentMethod === 'cash' ? 'ring-2 ring-primary border-primary' : ''
                }`}>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="cash" id="cash" />
                    <div className="flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-green-700" />
                      <Label htmlFor="cash" className="font-medium">Cash</Label>
                    </div>
                  </div>
                </Card>
              </div>
            </RadioGroup>
          </div>

          {/* Confirm Button */}
          <div className="pb-6">
            <Button 
              className="w-full py-6 text-lg font-semibold"
              size="lg"
              onClick={handleConfirmRide}
              disabled={false}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {searching ? "Searching for drivers..." : `Confirm Ride - ₹${selectedDriver ? availableDrivers.find(d => d.id === selectedDriver)?.fare : fareFor("e_rickshaw")}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
