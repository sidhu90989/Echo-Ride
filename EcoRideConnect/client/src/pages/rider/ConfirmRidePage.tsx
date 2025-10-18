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
import { RideMap } from "@/components/maps/RideMap";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

  // Mock ride data - in real app, this would come from route params
  const rideData = {
    pickup: "Current Location",
    dropoff: "MG Road Metro Station",
    distance: "4.2 km",
    duration: "12 min",
    co2Saved: "1.2 kg"
  };

  // Mock drivers data
  const availableDrivers: Driver[] = [
    {
      id: "1",
      name: "Ravi Kumar",
      rating: 4.8,
      vehicleNumber: "DL 8C 1234",
      estimatedArrival: 3,
      vehicleType: "E-Rickshaw",
      fare: 45
    },
    {
      id: "2", 
      name: "Priya Singh",
      rating: 4.9,
      vehicleNumber: "DL 7A 5678",
      estimatedArrival: 5,
      vehicleType: "E-Scooter",
      fare: 30
    },
    {
      id: "3",
      name: "Amit Sharma",
      rating: 4.7,
      vehicleNumber: "DL 9B 9876",
      estimatedArrival: 7,
      vehicleType: "CNG Car",
      fare: 80
    }
  ];

  const handleConfirmRide = async () => {
    if (!selectedDriver) {
      toast({
        title: "Please select a driver",
        variant: "destructive"
      });
      return;
    }

    setSearching(true);
    setSearchProgress(0);

    // Simulate search progress
    const interval = setInterval(() => {
      setSearchProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Navigate to tracking page
          setTimeout(() => {
            setLocation(`/rider/ride/${selectedDriver}/tracking`);
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

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
          <RideMap
            apiKey="mock-api-key"
            pickup={{ lat: 28.6139, lng: 77.2090 }}
            dropoff={{ lat: 28.7041, lng: 77.1025 }}
            rider={{ lat: 28.6139, lng: 77.2090 }}
            height={256}
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
              disabled={!selectedDriver}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Confirm Ride - ₹{selectedDriver ? availableDrivers.find(d => d.id === selectedDriver)?.fare : 0}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
