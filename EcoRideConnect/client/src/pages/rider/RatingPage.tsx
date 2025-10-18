import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";

export default function RatingPage() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto space-y-4">
      <Card className="p-6 space-y-4">
        <div className="text-lg font-semibold">Rate Your Ride</div>
        <div className="flex gap-2">
          {[1,2,3,4,5].map(n => (
            <Button key={n} variant="outline">{n}★</Button>
          ))}
        </div>
        <div className="space-y-2">
          <Label>How was your ride?</Label>
          <Textarea placeholder="Share your feedback" />
        </div>
        <Button className="w-full" size="lg" onClick={() => setLocation("/rider")}>
          Submit
        </Button>
      </Card>
    </div>
  );
}
