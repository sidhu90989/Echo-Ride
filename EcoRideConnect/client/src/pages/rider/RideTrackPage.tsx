import { withApiBase } from "@/lib/apiBase";
import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MapPin, ShieldAlert, Navigation, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RideMap, type LatLng } from "@/components/maps/RideMap";
import { useRideWebSocket } from "@/hooks/useRideWebSocket";

type Ride = {
  id: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  vehicleType: "e_rickshaw" | "e_scooter" | "cng_car";
  estimatedFare?: string | number;
  actualFare?: string | number;
  pickupLat?: string | number;
  pickupLng?: string | number;
  dropoffLat?: string | number;
  dropoffLng?: string | number;
};

export default function RideTrackPage() {
  const params = useParams<{ id: string }>();
  const rideId = params?.id || "";
  const { toast } = useToast();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [sosSending, setSosSending] = useState(false);
  const [riderLoc, setRiderLoc] = useState<LatLng | null>(null);
  const [driverLoc, setDriverLoc] = useState<LatLng | null>(null);

  const loadRide = async () => {
  const res = await fetch(withApiBase(`/api/rides/${rideId}`), { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setRide(data);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await loadRide();
      } finally {
        setLoading(false);
      }
    })();
    // Poll every 5s for status updates
    const t = setInterval(loadRide, 5000);
    return () => clearInterval(t);
  }, [rideId]);

  // WebSocket for live locations
  const { sendLocation } = useRideWebSocket({
    rideId,
    who: "rider",
    onMessage: (msg) => {
      if (msg.who === "driver") setDriverLoc({ lat: msg.lat, lng: msg.lng });
      if (msg.who === "rider") setRiderLoc({ lat: msg.lat, lng: msg.lng });
    },
  });

  // Send rider geolocation periodically
  useEffect(() => {
    let watchId: number | null = null;
    let interval: any = null;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setRiderLoc({ lat: latitude, lng: longitude });
          sendLocation(latitude, longitude);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
      );
    }
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (interval) clearInterval(interval);
    };
  }, []);

  const sendSOS = async () => {
    try {
      setSosSending(true);
      await apiRequest("POST", `/api/rides/${rideId}/sos`, {});
      toast({ title: "SOS triggered", description: "Support has been notified." });
    } catch (e) {
      toast({ title: "Failed to send SOS", variant: "destructive" });
    } finally {
      setSosSending(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!ride) return <div className="p-6">Ride not found.</div>;

  return (
    <div className="min-h-screen bg-background p-4 max-w-3xl mx-auto space-y-4">
      {/* Map */}
      <Card className="overflow-hidden">
        <RideMap
          apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}
          pickup={ride?.pickupLat && ride?.pickupLng ? { lat: Number(ride.pickupLat), lng: Number(ride.pickupLng) } : undefined}
          dropoff={ride?.dropoffLat && ride?.dropoffLng ? { lat: Number(ride.dropoffLat), lng: Number(ride.dropoffLng) } : undefined}
          rider={riderLoc}
          driver={driverLoc}
          height={260}
          autoFit
        />
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold">Ride #{ride.id.slice(0, 6)}</div>
              <div className="text-xs text-muted-foreground uppercase">{ride.vehicleType.replace("_"," ")}</div>
            </div>
          </div>
          <Badge>{ride.status.replace("_"," ")}</Badge>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <div>
              <div className="text-xs text-muted-foreground">Pickup</div>
              <div className="font-medium">{ride.pickupLocation}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            <div>
              <div className="text-xs text-muted-foreground">Dropoff</div>
              <div className="font-medium">{ride.dropoffLocation}</div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Fare</div>
            <div className="text-2xl font-bold">₹{Number(ride.actualFare ?? ride.estimatedFare ?? 0).toFixed(0)}</div>
          </div>
          <Button variant="destructive" onClick={sendSOS} disabled={sosSending} data-testid="button-sos">
            <ShieldAlert className="h-4 w-4 mr-2" />
            {sosSending ? "Sending..." : "SOS"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
