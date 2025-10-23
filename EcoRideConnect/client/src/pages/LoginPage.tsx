import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Smartphone } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { signInWithGoogle, ensureRecaptcha, signInWithPhoneNumber, confirmOTP, auth, googleProvider } from "@/lib/firebase";
import { signInWithRedirect } from "firebase/auth";
import OTPInput from "@/components/OTPInput";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [role, setRole] = useState<"rider" | "driver" | "admin">("rider");
  const [verifying, setVerifying] = useState(false);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"rider" | "driver" | "admin">("rider");
  const [phone, setPhone] = useState("");
  const [otpStage, setOtpStage] = useState<"phone" | "otp">("phone");
  const [sending, setSending] = useState(false);
  const [otp, setOtp] = useState("");
  const confirmationRef = useRef<import("firebase/auth").ConfirmationResult | null>(null);

  // Removed OIDC redirect handling; using native Firebase popup/redirect exclusively
  // Handle native Firebase redirect completion: if user is already signed into Firebase
  // (e.g., after signInWithRedirect), prepare role modal and send token to backend.
  useEffect(() => {
    (async () => {
      try {
        if ((window as any)._handledRedirect) return;
        const user = auth?.currentUser;
        if (!user) return;
        (window as any)._handledRedirect = true;
        const idToken = await user.getIdToken();
        (window as any)._pendingGoogle = {
          idToken,
          email: user.email || '',
          displayName: user.displayName || 'EcoRide User',
        };
        setSelectedRole(role);
        setRoleModalOpen(true);
      } catch {}
    })();
  }, [role]);

  const signInWithGoogleFlow = async () => {
    try {
      setVerifying(true);
      const cred = await signInWithGoogle();
      // Defer role selection to modal, then call server with idToken
      const idToken = await cred.user.getIdToken();
      (window as any)._pendingGoogle = { idToken, email: cred.user.email || '', displayName: cred.user.displayName || '' };
      setSelectedRole(role);
      setRoleModalOpen(true);
    } catch (e: any) {
      const msg: string = e?.message || String(e);
      const code: string | undefined = e?.code;
      // Fallback to redirect in environments that block popups (e.g., in-app browsers, some embeds)
      if (auth && googleProvider && (msg.includes("popup") || msg.includes("operation-not-supported"))) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return; // page will redirect
        } catch (e2: any) {
          toast({ title: "Google sign-in failed", description: e2.message || msg, variant: "destructive" });
          return;
        }
      }
      toast({ title: "Google sign-in failed", description: msg, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const completeLoginWithRole = async () => {
    const pending = (window as any)._pendingGoogle as { idToken?: string; email: string; displayName: string; phone?: string } | undefined;
    if (!pending) return setRoleModalOpen(false);
    const { email, displayName, phone: pendingPhone, idToken } = pending;
    try {
      // If we have an idToken (Google), use firebase-login; otherwise fallback to simple flow
      if (idToken) {
        const resp = await apiRequest('POST', '/api/auth/firebase-login', { idToken, role: selectedRole, phone: pendingPhone || '' });
        if (!resp.ok) throw new Error('Failed to establish session');
        const userData = await resp.json();
        setUser(userData);
        toast({ title: "Welcome to EcoRide!", description: `Signed in as ${userData.email}` });
        if (selectedRole === "admin") setLocation("/admin");
        else if (selectedRole === "driver") setLocation("/driver");
        else setLocation("/rider");
      } else {
        const res1 = await apiRequest("POST", "/api/auth/login", { email, name: displayName, role: selectedRole });
        if (!res1.ok) throw new Error("Failed to establish session");
        const res2 = await apiRequest("POST", "/api/auth/complete-profile", { name: displayName, phone: pendingPhone || "", role: selectedRole });
        const userData = await res2.json();
        setUser(userData);
        toast({ title: "Welcome to EcoRide!", description: `Signed in as ${email}` });
        if (selectedRole === "admin") setLocation("/admin");
        else if (selectedRole === "driver") setLocation("/driver");
        else setLocation("/rider");
      }
    } catch (e: any) {
      toast({ title: "Login failed", description: e.message || String(e), variant: "destructive" });
    } finally {
      setRoleModalOpen(false);
      (window as any)._pendingGoogle = undefined;
    }
  };

  const startPhoneLogin = () => {
    try { ensureRecaptcha(); } catch {}
    setPhoneModalOpen(true);
    setOtpStage("phone");
    setOtp("");
  };

  const sendOTP = async () => {
    const normalized = phone.replace(/\s/g, "");
    if (!/^\+?\d{10,15}$/.test(normalized)) {
      toast({ title: "Invalid phone number", description: "Please enter a valid phone number.", variant: "destructive" });
      return;
    }
    try {
      setSending(true);
      confirmationRef.current = await signInWithPhoneNumber(normalized);
      setOtpStage("otp");
      toast({ title: "OTP sent", description: `We've sent a code to ${phone}` });
    } catch (e: any) {
      toast({ title: "Failed to send OTP", description: e.message || String(e), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const verifyOTP = async () => {
    if (!confirmationRef.current) return;
    try {
      setVerifying(true);
      const cred = await confirmOTP(confirmationRef.current, otp);
      const pseudoName = `User ${phone.slice(-4)}`;
      // After phone auth, send ID token to server to create/update user and session
      const idToken = await cred.user.getIdToken();
      const resp = await apiRequest('POST', '/api/auth/firebase-login', { idToken, role });
      if (!resp.ok) throw new Error('Server failed to verify phone token');
      const userData = await resp.json();
      setUser(userData);
      toast({ title: 'Welcome to EcoRide!', description: `Signed in as ${userData.phone || userData.email}` });
      if (userData.role === 'admin') setLocation('/admin');
      else if (userData.role === 'driver') setLocation('/driver');
      else setLocation('/rider');
    } catch (e: any) {
      toast({ title: "OTP verification failed", description: e.message || String(e), variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1C1C1C] to-black p-4 text-white">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-emerald-500 rounded-full">
              <Leaf className="h-8 w-8 text-white" />
            </div>
            <h1 className="font-serif text-4xl font-bold">EcoRide</h1>
          </div>
          <p className="text-white/70 text-lg">Eco-friendly ride sharing</p>
        </div>

        <Card className="p-6 rounded-2xl bg-white text-black">
          <div className="space-y-6">
            {/* Google primary */}
            <div className="space-y-3">
              <div className="text-sm text-gray-600">Sign in with your Google account</div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg" onClick={signInWithGoogleFlow} disabled={verifying}>
                {verifying ? "Signing in..." : "Continue with Google"}
              </Button>
              <div className="text-xs text-gray-500">We’ll ask for your role after login.</div>
            </div>

            {/* Phone secondary */}
            <div className="space-y-3">
              <div className="text-sm text-gray-600">or</div>
              <Button variant="outline" className="w-full" size="lg" onClick={startPhoneLogin}>
                <Smartphone className="h-4 w-4 mr-2" />
                Continue with Phone
              </Button>
              <div id="recaptcha-container" />
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-white/60">
          By continuing, you agree to EcoRide's Terms of Service and Privacy Policy
        </p>
      </div>
    </div>

    {/* Phone Modal */}
    <Dialog open={phoneModalOpen} onOpenChange={setPhoneModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Continue with Phone</DialogTitle>
        </DialogHeader>
        {otpStage === "phone" && (
          <div className="space-y-4">
            <Label htmlFor="phone" className="text-sm">Phone number</Label>
            <div className="flex items-center gap-2">
              <div className="px-3 py-2 rounded-lg bg-gray-50 border text-sm">+91</div>
              <Input id="phone" placeholder="Enter 10-digit number" value={phone.replace(/^\+91\s?/, "+91 ")} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
            </div>
            <DialogFooter>
              <Button onClick={sendOTP} disabled={sending} className="w-full">
                {sending ? "Sending..." : "Send OTP"}
              </Button>
            </DialogFooter>
          </div>
        )}
        {otpStage === "otp" && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 text-center">Enter the 6-digit code sent to {phone}</div>
            <OTPInput length={6} onComplete={(code) => setOtp(code)} />
            <DialogFooter>
              <Button onClick={verifyOTP} disabled={otp.length !== 6 || verifying} className="w-full">
                {verifying ? "Verifying..." : "Verify OTP"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
  </Dialog>

    {/* Role Modal */}
    <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select your role</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: "rider", label: "Rider 🚗" },
            { key: "driver", label: "Driver 🚙" },
            { key: "admin", label: "Admin ⚙️" },
          ] as const).map((r) => (
            <button key={r.key} className={`py-2 rounded-lg text-sm border transition ${selectedRole === r.key ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-white"}`} onClick={() => setSelectedRole(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={completeLoginWithRole} className="w-full">Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
