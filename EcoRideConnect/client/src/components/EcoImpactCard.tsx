import { Card } from "@/components/ui/card";
import { Leaf, Award, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface EcoImpactCardProps {
  co2Saved: number;
  ecoPoints: number;
  ridesCount: number;
  nextBadgePoints?: number;
}

export function EcoImpactCard({ co2Saved, ecoPoints, ridesCount, nextBadgePoints }: EcoImpactCardProps) {
  const progress = nextBadgePoints ? (ecoPoints / nextBadgePoints) * 100 : 100;

  return (
    <Card className="bg-eco-mint dark:bg-eco-dark-green/20 border-l-4 border-primary">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-semibold text-lg flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            Your Eco Impact
          </h3>
          <Award className="h-6 w-6 text-primary" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center" data-testid="eco-co2-saved">
            <div className="text-2xl font-bold text-primary">{co2Saved.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">kg CO₂ Saved</div>
          </div>
          <div className="text-center" data-testid="eco-points">
            <div className="text-2xl font-bold text-primary">{ecoPoints}</div>
            <div className="text-xs text-muted-foreground">Eco Points</div>
          </div>
          <div className="text-center" data-testid="eco-rides">
            <div className="text-2xl font-bold text-primary">{ridesCount}</div>
            <div className="text-xs text-muted-foreground">Green Rides</div>
          </div>
        </div>

        {nextBadgePoints && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Next Badge Progress</span>
              <span className="font-medium">
                {ecoPoints}/{nextBadgePoints}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>Keep riding green to unlock more badges!</span>
        </div>
      </div>
    </Card>
  );
}
