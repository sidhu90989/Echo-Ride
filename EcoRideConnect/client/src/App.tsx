import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FullPageLoader } from "@/components/LoadingSpinner";

// Pages
import LoginPage from "@/pages/LoginPage";
import RiderDashboard from "@/pages/rider/RiderDashboard";
import RideHistoryPage from "@/pages/rider/RideHistoryPage";
import RewardsPage from "@/pages/rider/RewardsPage";
import DriverDashboard from "@/pages/driver/DriverDashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import NotFoundPage from "@/pages/NotFoundPage";
import RideTrackPage from "@/pages/rider/RideTrackPage";
import DriveRidePage from "@/pages/driver/DriveRidePage";
import ConfirmRidePage from "@/pages/rider/ConfirmRidePage";
import PaymentPage from "@/pages/rider/PaymentPage";
import RatingPage from "@/pages/rider/RatingPage";
import RideDetailsPage from "@/pages/rider/RideDetailsPage";
import WalletOffersPage from "@/pages/rider/WalletOffersPage";
import ProfileSettingsPage from "@/pages/rider/ProfileSettingsPage";
import EarningsPage from "@/pages/driver/EarningsPage";
import ProfileVerificationPage from "@/pages/driver/ProfileVerificationPage";
import UsersDriversPage from "@/pages/admin/UsersDriversPage";
import PaymentsCommissionPage from "@/pages/admin/PaymentsCommissionPage";
import OffersNotificationsPage from "@/pages/admin/OffersNotificationsPage";
import AnalyticsPage from "@/pages/admin/AnalyticsPage";
import SplashScreen from "@/pages/common/SplashScreen";
import OnboardingPage from "@/pages/common/OnboardingPage";
import ChargingStationsPage from "@/pages/common/ChargingStationsPage";
import LeaderboardPage from "@/pages/common/LeaderboardPage";

function ProtectedRoute({ 
  component: Component, 
  allowedRoles 
}: { 
  component: React.ComponentType; 
  allowedRoles?: string[] 
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to={`/${user.role}`} />;
  }

  return <Component />;
}

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <Switch>
      {/* Public Route */}
      <Route path="/">
        {user ? (
          <Redirect to={`/${user.role}`} />
        ) : (
          <LoginPage />
        )}
      </Route>

      {/* Rider Routes */}
      <Route path="/rider">
        <ProtectedRoute component={RiderDashboard} allowedRoles={["rider"]} />
      </Route>
      <Route path="/rider/history">
        <ProtectedRoute component={RideHistoryPage} allowedRoles={["rider"]} />
      </Route>
      <Route path="/rider/rewards">
        <ProtectedRoute component={RewardsPage} allowedRoles={["rider"]} />
      </Route>
      <Route path="/rider/ride/:id">
        <ProtectedRoute component={RideTrackPage} allowedRoles={["rider"]} />
      </Route>
      <Route path="/rider/confirm">
        <ProtectedRoute component={ConfirmRidePage} allowedRoles={["rider"]} />
      </Route>
      <Route path="/rider/payment">
        <ProtectedRoute component={PaymentPage} allowedRoles={["rider"]} />
      </Route>
      <Route path="/rider/rating">
        <ProtectedRoute component={RatingPage} allowedRoles={["rider"]} />
      </Route>
      <Route path="/rider/ride-details/:id">
        <ProtectedRoute component={RideDetailsPage} allowedRoles={["rider"]} />
      </Route>
      <Route path="/rider/wallet-offers">
        <ProtectedRoute component={WalletOffersPage} allowedRoles={["rider"]} />
      </Route>
      <Route path="/rider/profile">
        <ProtectedRoute component={ProfileSettingsPage} allowedRoles={["rider"]} />
      </Route>

      {/* Driver Routes */}
      <Route path="/driver">
        <ProtectedRoute component={DriverDashboard} allowedRoles={["driver"]} />
      </Route>
      <Route path="/driver/ride/:id">
        <ProtectedRoute component={DriveRidePage} allowedRoles={["driver"]} />
      </Route>
      <Route path="/driver/earnings">
        <ProtectedRoute component={EarningsPage} allowedRoles={["driver"]} />
      </Route>
      <Route path="/driver/profile">
        <ProtectedRoute component={ProfileVerificationPage} allowedRoles={["driver"]} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute component={UsersDriversPage} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/payments">
        <ProtectedRoute component={PaymentsCommissionPage} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/offers">
        <ProtectedRoute component={OffersNotificationsPage} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/analytics">
        <ProtectedRoute component={AnalyticsPage} allowedRoles={["admin"]} />
      </Route>

      {/* Common */}
      <Route path="/splash" component={SplashScreen} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/charging-stations" component={ChargingStationsPage} />
      <Route path="/leaderboard" component={LeaderboardPage} />

      {/* 404 */}
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
