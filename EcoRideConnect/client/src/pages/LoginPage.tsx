import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Mail } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { auth } from "@/lib/firebase";
import { withApiBase } from "@/lib/apiBase";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { signInWithGoogle, setUser, firebaseUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  // Show profile form first; we'll prompt Google sign-in on submit
  const [showRoleSelection, setShowRoleSelection] = useState(true);
  const [selectedRole, setSelectedRole] = useState<"rider" | "driver" | "admin">("rider");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // We no longer ask user to sign in first; we'll trigger Google sign-in on submit if needed

  const handleCompleteProfile = async () => {
    if (!name.trim() || !phone.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and phone number.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const SIMPLE_AUTH = import.meta.env.VITE_SIMPLE_AUTH === 'true';
      let userData: any;
      if (SIMPLE_AUTH) {
        // Call simple login to set session
        await apiRequest('POST', '/api/auth/login', {
          email: `${name.split(' ').join('.').toLowerCase()}@example.com`,
          name,
          role: selectedRole,
        });
        // Complete profile still needs to create a user row
        const res = await apiRequest("POST", "/api/auth/complete-profile", {
          name,
          phone,
          role: selectedRole,
        });
        userData = await res.json();
      } else {
        // Ensure the user is authenticated with Firebase first
        if (!auth?.currentUser && !firebaseUser) {
          await signInWithGoogle();
        }
        // Get a fresh ID token
        const token = await (auth?.currentUser || firebaseUser)?.getIdToken();
        if (!token) {
          throw new Error("Sign-in required to continue. Please try again.");
        }
        const res = await fetch(withApiBase("/api/auth/complete-profile"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, phone, role: selectedRole }),
        });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "Failed to complete profile");
        }
        userData = await res.json();
      }
      setUser(userData);
      
      toast({
        title: "Welcome to EcoRide!",
        description: "Your account has been created successfully.",
      });

      if (selectedRole === "admin") {
        setLocation("/admin");
      } else if (selectedRole === "driver") {
        setLocation("/driver");
      } else {
        setLocation("/rider");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to complete profile. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-eco-mint via-background to-eco-mint/50 dark:from-background dark:via-background dark:to-eco-dark-green/10 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-primary rounded-full">
              <Leaf className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="font-serif text-4xl font-bold text-foreground">EcoRide</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Join the movement towards cleaner, safer transportation
          </p>
        </div>

        <Card className="p-8">
          {showRoleSelection ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="font-serif text-2xl font-semibold text-center">Complete Your Profile</h2>
                <p className="text-muted-foreground text-center text-sm">
                  Tell us a bit about yourself. We’ll ask you to verify with Google on submit.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="input-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+91 XXXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    data-testid="input-phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label>I am a</Label>
                  <RadioGroup value={selectedRole} onValueChange={(value) => setSelectedRole(value as any)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="rider" id="rider" data-testid="radio-rider" />
                      <Label htmlFor="rider" className="font-normal cursor-pointer">
                        Rider - Book eco-friendly rides
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="driver" id="driver" data-testid="radio-driver" />
                      <Label htmlFor="driver" className="font-normal cursor-pointer">
                        Driver - Provide green transportation
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="admin" id="admin" data-testid="radio-admin" />
                      <Label htmlFor="admin" className="font-normal cursor-pointer">
                        Admin - Manage the platform
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleCompleteProfile}
                disabled={loading}
                size="lg"
                data-testid="button-complete-profile"
              >
                {loading ? "Verifying..." : "Continue"}
              </Button>
            </div>
          ) : null}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to EcoRide's Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
