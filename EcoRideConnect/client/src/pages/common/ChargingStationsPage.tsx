import { Card } from "@/components/ui/card";
import MapComponent from "@/components/MapComponent";

export default function ChargingStationsPage() {
  return (
    <div className="min-h-screen bg-background p-4 max-w-4xl mx-auto space-y-4">
      <Card className="overflow-hidden">
        <div style={{ height: 320 }}>
          <MapComponent />
        </div>
      </Card>
    </div>
  );
}
