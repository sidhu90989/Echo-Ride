import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function EarningsPage() {
  return (
    <div className="min-h-screen bg-background p-4 max-w-3xl mx-auto space-y-4">
      <Card className="p-4">
        <div className="text-lg font-semibold">Earnings</div>
        <Separator className="my-3" />
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Today</div>
            <div className="text-xl font-bold">₹ 0</div>
          </div>
          <div>
            <div className="text-muted-foreground">This Week</div>
            <div className="text-xl font-bold">₹ 0</div>
          </div>
          <div>
            <div className="text-muted-foreground">Trips</div>
            <div className="text-xl font-bold">0</div>
          </div>
          <div>
            <div className="text-muted-foreground">Eco Bonus</div>
            <div className="text-xl font-bold">₹ 0</div>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="text-lg font-semibold">Insights</div>
        <div className="text-sm text-muted-foreground">Charts coming soon</div>
      </Card>
    </div>
  );
}
