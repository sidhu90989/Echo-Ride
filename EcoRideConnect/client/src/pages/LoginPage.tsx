import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Smartphone } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import OTPInput from "@/components/OTPInput";
import { ensureRecaptcha, signInWithPhoneNumber, confirmOTP } from "@/lib/firebase";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [role, setRole] = useState<"rider" | "driver" | "admin">("rider");
  const [phone, setPhone] = useState("+91");
  const [otpStage, setOtpStage] = useState<"phone" | "otp">("phone");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otp, setOtp] = useState("");
  const confirmationRef = useRef<import("firebase/auth").ConfirmationResult | null>(null);

  // Ensure invisible recaptcha container exists
  useEffect(() => {
    try { ensureRecaptcha(); } catch {}
  }, []);

  const sendOTP = async () => {
    if (!/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ""))) {
      toast({ title: "Invalid phone number", description: "Please enter a valid phone number.", variant: "destructive" });
      return;
    }
    try {
      setSending(true);
      confirmationRef.current = await signInWithPhoneNumber(phone.replace(/\s/g, ""));
      setOtpStage("otp");
      toast({ title: "OTP sent", description: `We've sent a code to ${phone}` });
    } catch (e: any) {
      toast({ title: "Failed to send OTP", description: e.message || String(e), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const verifyOTP = async (code: string) => {
    if (!confirmationRef.current) return;
    try {
      setVerifying(true);
      await confirmOTP(confirmationRef.current, code);
      // Establish server session and create profile
      const pseudoName = `${role.charAt(0).toUpperCase() + role.slice(1)} User ${phone.slice(-4)}`;
      await apiRequest("POST", "/api/auth/login", {
        email: `${phone.replace(/\D/g, "")}@ecoride.local`,
        name: pseudoName,
        role,
      });
      const res = await apiRequest("POST", "/api/auth/complete-profile", {
        name: pseudoName,
        phone,
        role,
      });
      const userData = await res.json();
      setUser(userData);
      toast({ title: "Welcome to EcoRide!", description: "Logged in successfully." });
      if (role === "admin") setLocation("/admin");
      else if (role === "driver") setLocation("/driver");
      else setLocation("/rider");
    } catch (e: any) {
      toast({ title: "OTP verification failed", description: e.message || String(e), variant: "destructive" });
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

            {otpStage === "phone" && (
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-sm">Phone number</Label>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-2 rounded-lg bg-gray-50 border text-sm">+91</div>
                  <Input
                    id="phone"
                    placeholder="Enter 10-digit number"
                    value={phone.replace(/^\+91\s?/, "+91 ")}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                  />
                </div>
                <Button className="w-full" size="lg" onClick={sendOTP} disabled={sending}>
                  <Smartphone className="h-4 w-4 mr-2" />
                  {sending ? "Sending..." : "Continue"}
                </Button>
                <div id="recaptcha-container" />
              </div>
            )}

            {otpStage === "otp" && (
              <div className="space-y-4">
                <div className="text-center text-sm text-gray-600">Enter the 6-digit code sent to {phone}</div>
                <OTPInput length={6} onComplete={(code) => setOtp(code)} />
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => verifyOTP(otp)}
                  disabled={otp.length !== 6 || verifying}
                  data-testid="button-verify-otp"
                >
                  {verifying ? "Verifying..." : "Verify OTP"}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setOtpStage("phone")} disabled={verifying}>
                  Change number
                </Button>
              </div>
            )}
          </div>
        </Card>

        <p className="text-center text-xs text-white/60">
          By continuing, you agree to EcoRide's Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
