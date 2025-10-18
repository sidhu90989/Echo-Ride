import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function WalletOffersPage() {
  return (
    <div className="min-h-screen bg-background p-4 max-w-3xl mx-auto space-y-4">
      <Card className="p-4">
        <div className="text-lg font-semibold">Wallet</div>
        <div className="text-sm text-muted-foreground">Balance: ₹0.00</div>
        <div className="mt-3"><Button>Add Money</Button></div>
      </Card>
      <Card className="p-4">
        <div className="text-lg font-semibold">Offers</div>
        <div className="text-sm text-muted-foreground">No active offers</div>
      </Card>
    </div>
  );
}
