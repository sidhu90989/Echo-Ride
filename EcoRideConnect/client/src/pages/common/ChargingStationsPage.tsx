import { Card } from "@/components/ui/card";
import MapComponent from "@/components/MapComponent";

export default function ChargingStationsPage() {
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  return (
    <div className="min-h-screen bg-background p-4 max-w-4xl mx-auto space-y-4">
      <Card className="overflow-hidden">
        {mapsKey ? (
          <div style={{ height: 320 }}>
            <MapComponent />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">Enable maps with VITE_GOOGLE_MAPS_API_KEY</div>
        )}
      </Card>
    </div>
  );
}
