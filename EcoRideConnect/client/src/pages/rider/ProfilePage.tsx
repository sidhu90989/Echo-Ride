import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Shield,
  Bell,
  Globe,
  UserPlus,
  Edit,
  Trash2,
  Plus,
  AlertTriangle
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [editing, setEditing] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || "John Doe",
    email: user?.email || "john@example.com",
    phone: "+91 98765 43210",
    gender: "male",
    dateOfBirth: "1990-05-15",
    address: "123 Green Street, Eco City, Delhi"
  });

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { id: "1", name: "Jane Doe", phone: "+91 98765 43211", relation: "Sister" },
    { id: "2", name: "Robert Doe", phone: "+91 98765 43212", relation: "Father" }
  ]);

  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    relation: ""
  });

  const [notifications, setNotifications] = useState({
    rideUpdates: true,
    promotions: true,
    safety: true,
    newsletter: false
  });

  const [privacy, setPrivacy] = useState({
    shareLocation: true,
    dataCollection: true,
    marketing: false
  });

  const [selectedLanguage, setSelectedLanguage] = useState("english");

  const handleSaveProfile = () => {
    // In real app, make API call to update profile
    toast({
      title: "Profile updated",
      description: "Your profile has been saved successfully"
    });
    setEditing(false);
  };

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone || !newContact.relation) {
      toast({
        title: "All fields required",
        variant: "destructive"
      });
      return;
    }

    const contact: EmergencyContact = {
      id: Date.now().toString(),
      ...newContact
    };

    setEmergencyContacts([...emergencyContacts, contact]);
    setNewContact({ name: "", phone: "", relation: "" });
    setShowEmergencyDialog(false);
    
    toast({
      title: "Emergency contact added",
      description: `${newContact.name} has been added to your emergency contacts`
    });
  };

  const handleDeleteContact = (id: string) => {
    setEmergencyContacts(emergencyContacts.filter(c => c.id !== id));
    toast({
      title: "Contact removed",
      description: "Emergency contact has been removed"
    });
  };

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLocation("/rider")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-serif text-xl font-bold">Profile & Settings</h1>
          </div>
          <Button
            size="sm"
            variant={editing ? "default" : "outline"}
            onClick={() => editing ? handleSaveProfile() : setEditing(true)}
          >
            <Edit className="w-4 h-4 mr-1" />
            {editing ? "Save" : "Edit"}
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* Profile Picture & Basic Info */}
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-serif text-xl font-semibold">{profile.name}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
              <Badge variant="secondary" className="mt-1">
                Eco Rider • Level 3
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                disabled={!editing}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
                disabled={!editing}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                disabled={!editing}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={profile.gender} onValueChange={(value) => setProfile({...profile, gender: value})} disabled={!editing}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={profile.dateOfBirth}
                onChange={(e) => setProfile({...profile, dateOfBirth: e.target.value})}
                disabled={!editing}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => setProfile({...profile, address: e.target.value})}
                disabled={!editing}
                placeholder="Enter your home address"
              />
            </div>
          </div>
        </Card>

        {/* Emergency Contacts */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Emergency Contacts
            </h2>
            <Button
              size="sm"
              onClick={() => setShowEmergencyDialog(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Contact
            </Button>
          </div>
          
          <div className="space-y-3">
            {emergencyContacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span>{contact.phone}</span>
                      <span>•</span>
                      <span>{contact.relation}</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteContact(contact.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          
          {emergencyContacts.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              <p>No emergency contacts added</p>
              <p className="text-sm">Add contacts for safety during rides</p>
            </div>
          )}
        </Card>

        {/* Notification Preferences */}
        <Card className="p-4">
          <h2 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notification Settings
          </h2>
          
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <Label htmlFor={key} className="font-medium">
                    {key === 'rideUpdates' && 'Ride Updates'}
                    {key === 'promotions' && 'Promotions & Offers'}
                    {key === 'safety' && 'Safety Alerts'}
                    {key === 'newsletter' && 'Newsletter'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {key === 'rideUpdates' && 'Driver updates, arrival notifications'}
                    {key === 'promotions' && 'Special offers and discounts'}
                    {key === 'safety' && 'Emergency and safety notifications'}
                    {key === 'newsletter' && 'Monthly eco-impact reports'}
                  </p>
                </div>
                <Switch
                  id={key}
                  checked={value}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, [key]: checked})
                  }
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="p-4">
          <h2 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Privacy Settings
          </h2>
          
          <div className="space-y-4">
            {Object.entries(privacy).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <Label htmlFor={key} className="font-medium">
                    {key === 'shareLocation' && 'Share Location with Driver'}
                    {key === 'dataCollection' && 'Allow Data Collection'}
                    {key === 'marketing' && 'Marketing Communications'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {key === 'shareLocation' && 'Enable precise location sharing during rides'}
                    {key === 'dataCollection' && 'Help improve service with usage data'}
                    {key === 'marketing' && 'Receive marketing emails and SMS'}
                  </p>
                </div>
                <Switch
                  id={key}
                  checked={value}
                  onCheckedChange={(checked) => 
                    setPrivacy({...privacy, [key]: checked})
                  }
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Language & Region */}
        <Card className="p-4">
          <h2 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Language & Region
          </h2>
          
          <div className="space-y-2">
            <Label>App Language</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="hindi">हिंदी (Hindi)</SelectItem>
                <SelectItem value="bengali">বাংলা (Bengali)</SelectItem>
                <SelectItem value="tamil">தமிழ் (Tamil)</SelectItem>
                <SelectItem value="telugu">తెలుగు (Telugu)</SelectItem>
                <SelectItem value="marathi">मराठी (Marathi)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Account Actions */}
        <Card className="p-4">
          <h2 className="font-serif text-lg font-semibold mb-4">Account Actions</h2>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => toast({ title: "Feature coming soon!" })}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Refer Friends & Earn
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => toast({ title: "Download started!" })}
            >
              <Mail className="w-4 h-4 mr-2" />
              Download My Data
            </Button>
            
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </Card>
      </div>

      {/* Add Emergency Contact Dialog */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Emergency Contact</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Full Name</Label>
              <Input
                id="contact-name"
                value={newContact.name}
                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                placeholder="Enter contact name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone Number</Label>
              <Input
                id="contact-phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                placeholder="+91 98765 43210"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact-relation">Relationship</Label>
              <Select value={newContact.relation} onValueChange={(value) => setNewContact({...newContact, relation: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="relative">Relative</SelectItem>
                  <SelectItem value="colleague">Colleague</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEmergencyDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddContact}
              >
                Add Contact
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}