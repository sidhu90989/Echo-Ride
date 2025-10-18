import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ArrowLeft, Award, Share2, Copy } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import type { Badge as BadgeType } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export default function RewardsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: badges, isLoading } = useQuery<BadgeType[]>({
    queryKey: ["/api/rider/badges"],
  });

  const handleCopyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="flex items-center gap-4 px-4 py-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/rider")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-serif text-xl font-bold">Rewards & Badges</h1>
        </div>
      </header>

      <div className="p-4 max-w-4xl mx-auto space-y-6">
        {/* Referral Card */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-lg font-semibold">Invite & Earn</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Invite friends to EcoRide and earn 100 eco-points for each successful referral!
            </p>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-background rounded-md border">
                <p className="text-xs text-muted-foreground mb-1">Your Referral Code</p>
                <p className="font-mono font-semibold" data-testid="text-referral-code">
                  {user?.referralCode || "LOADING..."}
                </p>
              </div>
              <Button
                size="icon"
                onClick={handleCopyReferralCode}
                data-testid="button-copy-referral"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Eco Points Summary */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold">Your Eco Points</h2>
            <Badge className="text-lg px-4 py-2" data-testid="badge-eco-points">
              {user?.ecoPoints || 0} Points
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Earn points with every eco-friendly ride and unlock exclusive badges!
          </p>
        </Card>

        {/* Badges Section */}
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-semibold">Eco Badges</h2>
          
          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner />
            </div>
          ) : badges && badges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {badges.map((badge: any) => (
                <Card key={badge.id} className="p-6" data-testid={`card-badge-${badge.id}`}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{badge.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{badge.description}</p>
                      {badge.earned ? (
                        <Badge variant="secondary">Earned!</Badge>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {badge.requiredPoints} points needed
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No badges available yet</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
