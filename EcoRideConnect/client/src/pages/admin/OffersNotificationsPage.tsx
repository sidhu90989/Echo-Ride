import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function OffersNotificationsPage() {
  return (
    <div className="min-h-screen bg-background p-4 max-w-3xl mx-auto space-y-4">
      <Card className="p-4 space-y-3">
        <div className="text-lg font-semibold">Offers & Notifications</div>
        <Input placeholder="Create an offer" />
        <Button>Create</Button>
      </Card>
    </div>
  );
}
