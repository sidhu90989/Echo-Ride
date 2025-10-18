import { Card } from "@/components/ui/card";
import { Bike, Car, TramFront } from "lucide-react";

interface VehicleCardProps {
  type: "e_rickshaw" | "e_scooter" | "cng_car";
  selected: boolean;
  onSelect: () => void;
  estimatedFare?: number;
  eta?: number;
}

const vehicleConfig = {
  e_rickshaw: {
    name: "E-Rickshaw",
    icon: TramFront,
    description: "Eco-friendly & affordable",
    capacity: "2-3 passengers",
  },
  e_scooter: {
    name: "E-Scooter",
    icon: Bike,
    description: "Quick & nimble",
    capacity: "1 passenger",
  },
  cng_car: {
    name: "CNG Car",
    icon: Car,
    description: "Comfortable & clean",
    capacity: "4 passengers",
  },
};

export function VehicleCard({ type, selected, onSelect, estimatedFare, eta }: VehicleCardProps) {
  const config = vehicleConfig[type];
  const Icon = config.icon;

  return (
    <Card
      className={`cursor-pointer transition-all hover-elevate active-elevate-2 ${
        selected ? "border-2 border-primary bg-eco-mint dark:bg-primary/10" : ""
      }`}
      onClick={onSelect}
      data-testid={`card-vehicle-${type}`}
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${selected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-lg" data-testid={`text-vehicle-name-${type}`}>
                {config.name}
              </h3>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{config.capacity}</span>
          {estimatedFare && (
            <span className="font-semibold text-lg" data-testid={`text-fare-${type}`}>
              ₹{estimatedFare}
            </span>
          )}
        </div>
        
        {eta && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>ETA: {eta} mins</span>
          </div>
        )}
      </div>
    </Card>
  );
}
