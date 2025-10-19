import { withApiBase } from "@/lib/apiBase";
import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MapPin, Navigation, Car } from "lucide-react";
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
  pickupLat?: string | number;
  pickupLng?: string | number;
  dropoffLat?: string | number;
  dropoffLng?: string | number;
};

export default function DriveRidePage() {
  const params = useParams<{ id: string }>();
  const rideId = params?.id || "";
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [driverLoc, setDriverLoc] = useState<LatLng | null>(null);
  const [riderLoc, setRiderLoc] = useState<LatLng | null>(null);

  const loadRide = async () => {
  const res = await fetch(withApiBase(`/api/rides/${rideId}`), { credentials: "include" });
    if (res.ok) setRide(await res.json());
  };

  useEffect(() => {
    (async () => {
      try { await loadRide(); } finally { setLoading(false); }
    })();
    const t = setInterval(loadRide, 5000);
    return () => clearInterval(t);
  }, [rideId]);

  const { sendLocation } = useRideWebSocket({
    rideId,
    who: "driver",
    onMessage: (msg) => {
      if (msg.who === "rider") setRiderLoc({ lat: msg.lat, lng: msg.lng });
      if (msg.who === "driver") setDriverLoc({ lat: msg.lat, lng: msg.lng });
    },
  });

  useEffect(() => {
    let watchId: number | null = null;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setDriverLoc({ lat: latitude, lng: longitude });
          sendLocation(latitude, longitude);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
      );
    }
    return () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); };
  }, [sendLocation]);

  const startRide = async () => {
    try {
      setBusy(true);
      await apiRequest("POST", `/api/rides/${rideId}/start`, {});
      await loadRide();
      toast({ title: "Ride started" });
    } catch {
      toast({ title: "Failed to start", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const completeRide = async () => {
    try {
      setBusy(true);
      await apiRequest("POST", `/api/rides/${rideId}/complete`, {});
      await loadRide();
      toast({ title: "Ride completed" });
      setLocation("/driver");
    } catch {
      toast({ title: "Failed to complete", variant: "destructive" });
    } finally { setBusy(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!ride) return <div className="p-6">Ride not found.</div>;

  return (
    <div className="min-h-screen bg-background p-4 max-w-3xl mx-auto space-y-4">
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

      <div className="flex gap-2">
        <Button className="flex-1" onClick={startRide} disabled={busy} data-testid="button-start-ride">Start</Button>
        <Button className="flex-1" variant="outline" onClick={completeRide} disabled={busy} data-testid="button-complete-ride">Complete</Button>
      </div>
    </div>
  );
}
