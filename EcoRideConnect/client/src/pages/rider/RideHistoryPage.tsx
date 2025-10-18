import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RideCard } from "@/components/RideCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import type { Ride } from "@shared/schema";

export default function RideHistoryPage() {
  const [, setLocation] = useLocation();

  const { data: rides, isLoading } = useQuery<Ride[]>({
    queryKey: ["/api/rider/rides"],
  });

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
          <h1 className="font-serif text-xl font-bold">Ride History</h1>
        </div>
      </header>

      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner />
          </div>
        ) : rides && rides.length > 0 ? (
          rides.map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              onClick={() => setLocation(`/rider/ride/${ride.id}`)}
            />
          ))
        ) : (
          <div className="text-center py-12 space-y-4">
            <p className="text-muted-foreground">No rides yet</p>
            <Button onClick={() => setLocation("/rider")} data-testid="button-book-first-ride">
              Book Your First Ride
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
