import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  ArrowLeft, 
  Phone, 
  MessageCircle, 
  Share, 
  AlertTriangle,
  Star,
  Navigation,
  Clock,
  MapPin,
  X
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { RideMap } from "@/components/maps/RideMap";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DriverInfo {
  id: string;
  name: string;
  rating: number;
  vehicleNumber: string;
  vehicleType: string;
  profileImage?: string;
  phone: string;
  currentLocation: { lat: number; lng: number };
  estimatedArrival: number;
}

export default function RideTrackingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedCancelReason, setSelectedCancelReason] = useState("");
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "driver", message: "Hi! I'm on my way to pick you up.", time: "2 mins ago" },
    { id: 2, sender: "rider", message: "Great! I'm waiting near the main gate.", time: "1 min ago" }
  ]);

  // Mock driver data - in real app, this would come from API
  const driverInfo: DriverInfo = {
    id: "1",
    name: "Ravi Kumar",
    rating: 4.8,
    vehicleNumber: "DL 8C 1234",
    vehicleType: "E-Rickshaw",
    phone: "+91 98765 43210",
    currentLocation: { lat: 28.6129, lng: 77.2095 },
    estimatedArrival: 3
  };

  const rideInfo = {
    pickup: "Current Location",
    dropoff: "MG Road Metro Station",
    status: "driver_arriving", // driver_arriving, in_progress, completed
    fare: 45,
    rideId: "R123456"
  };

  const cancelReasons = [
    "Driver is taking too long",
    "Changed my mind",
    "Found alternative transport",
    "Emergency came up",
    "Wrong pickup location",
    "Other"
  ];

  const handleCancelRide = async () => {
    if (!selectedCancelReason && !cancelReason.trim()) {
      toast({
        title: "Please select or enter a reason",
        variant: "destructive"
      });
      return;
    }

    try {
      // In real app, call API to cancel ride
      toast({
        title: "Ride Cancelled",
        description: "Your ride has been cancelled successfully."
      });
      setLocation("/rider");
    } catch (error) {
      toast({
        title: "Failed to cancel ride",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    const newMessage = {
      id: chatMessages.length + 1,
      sender: "rider",
      message: chatMessage,
      time: "now"
    };
    
    setChatMessages([...chatMessages, newMessage]);
    setChatMessage("");
  };

  const handleSOS = () => {
    toast({
      title: "SOS Alert Sent",
      description: "Emergency contacts have been notified with your location.",
      variant: "destructive"
    });
  };

  const handleShareLocation = () => {
    const shareText = `🚗 I'm on a ride with EcoRide!\nRide ID: ${rideInfo.rideId}\nDriver: ${driverInfo.name}\nVehicle: ${driverInfo.vehicleNumber}\nTrack my ride: https://ecoride.app/track/${rideInfo.rideId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'EcoRide - Live Location',
        text: shareText
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Location copied to clipboard",
        description: "Share this with your contacts"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocation("/rider")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-serif text-xl font-bold">Your Ride</h1>
              <p className="text-sm text-muted-foreground">ID: {rideInfo.rideId}</p>
            </div>
          </div>
          
          {/* SOS Button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleSOS}
            className="bg-red-600 hover:bg-red-700"
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            SOS
          </Button>
        </div>
      </header>

      <div className="space-y-4">
        {/* Live Map */}
        <div className="h-80 relative">
          <RideMap
            apiKey="mock-api-key"
            pickup={{ lat: 28.6139, lng: 77.2090 }}
            dropoff={{ lat: 28.7041, lng: 77.1025 }}
            rider={{ lat: 28.6139, lng: 77.2090 }}
            driver={driverInfo.currentLocation}
            height={320}
          />
          
          {/* Status Overlay */}
          <div className="absolute top-4 left-4 right-4">
            <Card className="p-3 bg-background/95 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-sm">
                    {rideInfo.status === 'driver_arriving' ? 'Driver arriving' : 'Ride in progress'}
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {driverInfo.estimatedArrival} min
                </Badge>
              </div>
            </Card>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Driver Info Card */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <span className="font-bold text-xl">{driverInfo.name.charAt(0)}</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{driverInfo.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{driverInfo.rating}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{driverInfo.vehicleType}</span>
                  <span>{driverInfo.vehicleNumber}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Navigation className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    {driverInfo.estimatedArrival} min away
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`tel:${driverInfo.phone}`)}
                  className="w-full"
                >
                  <Phone className="w-4 h-4 mr-1" />
                  Call
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowChatDialog(true)}
                  className="w-full"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Chat
                </Button>
              </div>
            </div>
          </Card>

          {/* Trip Details */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Trip Details</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium">{rideInfo.pickup}</p>
                  <p className="text-sm text-muted-foreground">Pickup location</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium">{rideInfo.dropoff}</p>
                  <p className="text-sm text-muted-foreground">Drop-off location</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Estimated Fare</span>
                  <span className="font-semibold">₹{rideInfo.fare}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleShareLocation}
            >
              <Share className="w-4 h-4 mr-2" />
              Share Live Location
            </Button>
            
            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setShowCancelDialog(true)}
            >
              Cancel Ride
            </Button>
          </div>
        </div>
      </div>

      {/* Cancel Ride Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Ride</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please let us know why you're cancelling your ride:
            </p>
            
            <RadioGroup value={selectedCancelReason} onValueChange={setSelectedCancelReason}>
              {cancelReasons.map((reason, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={`reason-${index}`} />
                  <Label htmlFor={`reason-${index}`} className="text-sm">{reason}</Label>
                </div>
              ))}
            </RadioGroup>
            
            {selectedCancelReason === "Other" && (
              <Textarea
                placeholder="Please specify..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-2"
              />
            )}
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelDialog(false)}
              >
                Keep Ride
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleCancelRide}
              >
                Cancel Ride
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="max-w-md h-96 flex flex-col">
          <DialogHeader>
            <DialogTitle>Chat with {driverInfo.name}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 space-y-3 overflow-y-auto">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'rider' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    msg.sender === 'rider'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p>{msg.message}</p>
                  <p className={`text-xs mt-1 ${
                    msg.sender === 'rider' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 pt-3 border-t">
            <input
              type="text"
              placeholder="Type a message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 px-3 py-2 border rounded-md text-sm"
            />
            <Button size="sm" onClick={handleSendMessage}>
              Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}