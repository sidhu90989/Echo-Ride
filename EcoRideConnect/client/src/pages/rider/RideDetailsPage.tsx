import { Card } from "@/components/ui/card";
import { useParams } from "wouter";

export default function RideDetailsPage() {
  const params = useParams<{ id: string }>();
  return (
    <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto space-y-4">
      <Card className="p-4">
        <div className="text-lg font-semibold">Ride Receipt</div>
        <div className="text-sm text-muted-foreground">Ride ID: {params?.id}</div>
        <div className="mt-4 space-y-1 text-sm">
          <div>Date: Today</div>
          <div>Amount: ₹120</div>
          <div>CO₂ Saved: 1.2 kg</div>
          <div>Vehicle: E-Rickshaw</div>
        </div>
      </Card>
    </div>
  );
}
