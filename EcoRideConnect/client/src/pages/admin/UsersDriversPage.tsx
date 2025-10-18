import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function UsersDriversPage() {
  return (
    <div className="min-h-screen bg-background p-4 space-y-4 max-w-5xl mx-auto">
      <Card className="p-4 space-y-3">
        <div className="text-lg font-semibold">Manage Users & Drivers</div>
        <Input placeholder="Search users/drivers" />
        <div className="text-sm text-muted-foreground">Listing coming soon</div>
      </Card>
    </div>
  );
}
