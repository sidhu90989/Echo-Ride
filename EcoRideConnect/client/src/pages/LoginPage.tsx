import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Leaf } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { signInWithGoogle } from "@/lib/firebase";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [role, setRole] = useState<"rider" | "driver" | "admin">("rider");
  const [verifying, setVerifying] = useState(false);

  const signInWithGoogleFlow = async () => {
    try {
      setVerifying(true);
      const cred = await signInWithGoogle();
      const email = cred.user.email || `${role}@example.com`;
      const displayName = cred.user.displayName || `${role.charAt(0).toUpperCase() + role.slice(1)} User`;
      // Create session + profile in SIMPLE_AUTH via our backend
      await apiRequest("POST", "/api/auth/login", { email, name: displayName, role });
      const res = await apiRequest("POST", "/api/auth/complete-profile", { name: displayName, phone: "", role });
      const userData = await res.json();
      setUser(userData);
      toast({ title: "Welcome to EcoRide!", description: `Signed in as ${email}` });
      if (role === "admin") setLocation("/admin");
      else if (role === "driver") setLocation("/driver");
      else setLocation("/rider");
    } catch (e: any) {
      toast({ title: "Google sign-in failed", description: e.message || String(e), variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1C1C1C] to-black p-4 text-white">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-emerald-500 rounded-full">
              <Leaf className="h-8 w-8 text-white" />
            </div>
            <h1 className="font-serif text-4xl font-bold">EcoRide</h1>
          </div>
          <p className="text-white/70 text-lg">
            Sign in with your phone to continue
          </p>
        </div>

        <Card className="p-6 rounded-2xl bg-white text-black">
          <div className="space-y-6">
            {/* Role selection */}
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "rider", label: "Rider 🚗" },
                { key: "driver", label: "Driver 🚙" },
                { key: "admin", label: "Admin ⚙️" },
              ] as const).map((r) => (
                <button
                  key={r.key}
                  className={`py-2 rounded-lg text-sm border transition ${
                    role === r.key ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-white"
                  }`}
                  onClick={() => setRole(r.key)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Google sign-in only */}
            {
              <div className="space-y-3">
                <div className="text-sm text-gray-600">Sign in with your Google account</div>
                <Button className="w-full" size="lg" onClick={signInWithGoogleFlow} disabled={verifying}>
                  {verifying ? "Signing in..." : "Continue with Google"}
                </Button>
                <div className="text-xs text-gray-500">We’ll link your Google email to your {role} profile.</div>
              </div>
            }
          </div>
        </Card>

        <p className="text-center text-xs text-white/60">
          By continuing, you agree to EcoRide's Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
