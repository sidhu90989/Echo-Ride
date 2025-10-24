import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Leaf, MapPin, ShieldCheck, Route, Gift, Zap, Users } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import HomeMapHero from "@/components/maps/HomeMapHero";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <span className="font-serif text-xl font-bold">RideConnect</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Button onClick={() => setLocation(`/${user.role}`)}>Go to Dashboard</Button>
            ) : (
              <Button onClick={() => setLocation("/login")}>Get Started</Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-8 grid gap-10 md:grid-cols-2 items-center">
        <div className="space-y-6">
          <h1 className="font-serif text-4xl md:text-5xl font-semibold leading-tight">
            Ride smart. Ride safe. Earn rewards with every trip.
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            An Ola/Uber–style experience with electric and CNG rides. Real-time tracking, safety-first design, and a rewards program for every ride.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => setLocation(user ? `/${user.role}` : "/login")}>Book your first ride</Button>
            <Button size="lg" variant="outline" onClick={() => setLocation("/onboarding")}>How it works</Button>
          </div>
          <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> EV-first options</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Safety features</div>
            <div className="flex items-center gap-2"><Gift className="h-4 w-4 text-primary" /> Rewards & badges</div>
          </div>
        </div>
        <div className="relative">
          <HomeMapHero />
          <div className="absolute -bottom-4 -left-4 hidden md:block">
            <Card className="p-4 shadow-lg">
              <div className="text-xs text-muted-foreground mb-1">Rides this month</div>
              <div className="text-2xl font-bold">1,247 trips</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Choose your ride type</h3>
            <p className="text-sm text-muted-foreground">E‑Rickshaw, E‑Scooter, or CNG Car. Female driver preference for added comfort.</p>
          </Card>
          <Card className="p-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Route className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Live tracking & safety</h3>
            <p className="text-sm text-muted-foreground">Real-time location sharing, SOS prompt, and verified drivers for peace of mind.</p>
          </Card>
          <Card className="p-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Rewards for every ride</h3>
            <p className="text-sm text-muted-foreground">Earn points and unlock badges with every completed trip.</p>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="rounded-2xl border bg-card p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-serif text-2xl font-semibold mb-2">Ready to ride smarter?</h3>
            <p className="text-sm text-muted-foreground">Join RideConnect today and start earning rewards for every trip.</p>
          </div>
          {user ? (
            <Button size="lg" onClick={() => setLocation(`/${user.role}`)}>Open Dashboard</Button>
          ) : (
            <Button size="lg" onClick={() => setLocation("/login")}>Create your account</Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-sm text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span>RideConnect</span>
          </div>
          <div>
            <button className="underline-offset-4 hover:underline" onClick={() => setLocation("/charging-stations")}>Charging Stations</button>
            <span className="mx-2">·</span>
            <button className="underline-offset-4 hover:underline" onClick={() => setLocation("/leaderboard")}>Leaderboard</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
