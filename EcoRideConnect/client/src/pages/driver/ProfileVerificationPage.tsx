import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ProfileVerificationPage() {
  return (
    <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto space-y-4">
      <Card className="p-4 space-y-4">
        <div className="text-lg font-semibold">KYC Verification</div>
        <div className="space-y-2">
          <Label>License Number</Label>
          <Input placeholder="Enter license number" />
        </div>
        <div className="space-y-2">
          <Label>Vehicle Number</Label>
          <Input placeholder="Enter vehicle number" />
        </div>
        <Button>Upload Documents</Button>
      </Card>
    </div>
  );
}
