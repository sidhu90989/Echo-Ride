import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto space-y-4">
      {["Eco", "Safe", "Affordable"].map((title, i) => (
        <Card key={i} className="p-6">
          <div className="text-lg font-semibold">{title}</div>
          <div className="text-sm text-muted-foreground">Learn more about EcoRide</div>
        </Card>
      ))}
      <div className="text-right">
        <Button>Get Started</Button>
      </div>
    </div>
  );
}
