import { Card } from "@/components/ui/card";
import { RideMap } from "@/components/maps/RideMap";

export default function ChargingStationsPage() {
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  return (
    <div className="min-h-screen bg-background p-4 max-w-4xl mx-auto space-y-4">
      <Card className="overflow-hidden">
        {mapsKey ? (
          <RideMap apiKey={mapsKey} height={320} />
        ) : (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Enable maps with VITE_GOOGLE_MAPS_API_KEY</div>
        )}
      </Card>
    </div>
  );
}
