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

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { signInWithGoogle, setUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"rider" | "driver" | "admin">("rider");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      setShowRoleSelection(true);
    } catch (error) {
      toast({
        title: "Sign In Failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
      const response = await apiRequest("POST", "/api/auth/complete-profile", {
        name,
        phone,
        role: selectedRole,
      });
      
      const userData = await response.json();
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
      toast({
        title: "Error",
        description: "Failed to complete profile. Please try again.",
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
          {!showRoleSelection ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="font-serif text-2xl font-semibold text-center">Welcome</h2>
                <p className="text-muted-foreground text-center text-sm">
                  Sign in to start your eco-friendly journey
                </p>
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleGoogleSignIn}
                disabled={loading}
                size="lg"
                data-testid="button-google-signin"
              >
                <SiGoogle className="h-5 w-5" />
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                disabled
                size="lg"
              >
                <Mail className="h-5 w-5" />
                Continue with Email (Coming Soon)
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="font-serif text-2xl font-semibold text-center">Complete Your Profile</h2>
                <p className="text-muted-foreground text-center text-sm">
                  Tell us a bit about yourself
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
                {loading ? "Setting up..." : "Get Started"}
              </Button>
            </div>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to EcoRide's Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
