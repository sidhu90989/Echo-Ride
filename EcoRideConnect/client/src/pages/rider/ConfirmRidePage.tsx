import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RideMap } from "@/components/maps/RideMap";
import { useLocation } from "wouter";

export default function ConfirmRidePage() {
  const [, setLocation] = useLocation();
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  return (
    <div className="min-h-screen bg-background p-4 max-w-3xl mx-auto space-y-4">
      <Card className="overflow-hidden">
        {mapsKey ? (
          <RideMap apiKey={mapsKey} height={260} />
        ) : (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Enable maps with VITE_GOOGLE_MAPS_API_KEY</div>
        )}
      </Card>

      <Card className="p-4 space-y-4">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">EcoRide tip</div>
          <div className="font-medium">This ride saves approximately 1.2 kg CO₂</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block">Payment Method</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="wallet">Wallet</SelectItem>
                <SelectItem value="card">Credit/Debit Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full" size="lg" onClick={() => setLocation("/rider/payment")}>Confirm — Searching Drivers…</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
