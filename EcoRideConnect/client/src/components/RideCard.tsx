import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Leaf } from "lucide-react";
import { format } from "date-fns";
import type { Ride } from "@shared/schema";

interface RideCardProps {
  ride: Ride & {
    driverName?: string;
    driverRating?: string;
  };
  onClick?: () => void;
}

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  accepted: { label: "Accepted", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  in_progress: { label: "In Progress", color: "bg-primary/20 text-primary" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

export function RideCard({ ride, onClick }: RideCardProps) {
  const statusInfo = statusConfig[ride.status];

  return (
    <Card 
      className={`hover-elevate active-elevate-2 ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      data-testid={`card-ride-${ride.id}`}
    >
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold" data-testid={`text-ride-pickup-${ride.id}`}>
                {ride.pickupLocation}
              </h4>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span data-testid={`text-ride-dropoff-${ride.id}`}>{ride.dropoffLocation}</span>
            </div>
          </div>
          <Badge className={statusInfo.color} data-testid={`badge-ride-status-${ride.id}`}>
            {statusInfo.label}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{format(new Date(ride.requestedAt), "MMM d, h:mm a")}</span>
            </div>
            {ride.distance && (
              <span className="text-muted-foreground">{Number(ride.distance).toFixed(1)} km</span>
            )}
          </div>
          {ride.actualFare && (
            <span className="font-semibold text-lg" data-testid={`text-ride-fare-${ride.id}`}>
              ₹{Number(ride.actualFare).toFixed(0)}
            </span>
          )}
        </div>

        {ride.co2Saved && (
          <div className="flex items-center gap-2 p-3 bg-eco-mint dark:bg-eco-dark-green/20 rounded-md">
            <Leaf className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {Number(ride.co2Saved).toFixed(2)} kg CO₂ saved
            </span>
            {ride.ecoPointsEarned && (
              <span className="text-sm text-muted-foreground">
                +{ride.ecoPointsEarned} points
              </span>
            )}
          </div>
        )}

        {ride.driverName && (
          <div className="text-sm text-muted-foreground">
            Driver: {ride.driverName} {ride.driverRating && `⭐ ${ride.driverRating}`}
          </div>
        )}
      </div>
    </Card>
  );
}
