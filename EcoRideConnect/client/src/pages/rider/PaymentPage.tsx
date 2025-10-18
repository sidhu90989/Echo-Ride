import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";

export default function PaymentPage() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto space-y-4">
      <Card className="p-4 space-y-4">
        <div className="text-lg font-semibold">Payment</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="outline">UPI</Button>
          <Button variant="outline">Wallet</Button>
          <Button variant="outline">Credit/Debit</Button>
          <Button variant="outline">Cash</Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="promo">Promo Code</Label>
          <div className="flex gap-2">
            <Input id="promo" placeholder="Enter code" />
            <Button variant="secondary">Apply</Button>
          </div>
        </div>
        <Button className="w-full" size="lg" onClick={() => setLocation("/rider/rating")}>
          Pay Now
        </Button>
      </Card>
    </div>
  );
}
