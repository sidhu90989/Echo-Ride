import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ProfileSettingsPage() {
  return (
    <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto space-y-4">
      <Card className="p-4 space-y-4">
        <div className="text-lg font-semibold">Profile</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Name</Label>
            <Input placeholder="Your name" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input placeholder="Mobile number" />
          </div>
        </div>
      </Card>
      <Card className="p-4 space-y-2">
        <div className="text-lg font-semibold">Emergency Contacts</div>
        <Input placeholder="Add contact number" />
        <div><Button>Add</Button></div>
      </Card>
      <div className="text-right">
        <Button>Save</Button>
      </div>
    </div>
  );
}
