import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FullPageLoader } from "@/components/LoadingSpinner";
import ProtectedRoute from "@/components/ProtectedRoute";

// Import API validator for development
if (import.meta.env.DEV) {
  import("./lib/api-validator");
}

// Pages
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/common/HomePage";
import RiderDashboard from "@/pages/rider/RiderDashboard";
import RideHistoryPage from "@/pages/rider/RideHistoryPage";
import RewardsPage from "@/pages/rider/RewardsPage";
import ConfirmRidePage from "@/pages/rider/ConfirmRidePage";
import RideTrackingPage from "@/pages/rider/RideTrackingPage";
import PaymentPage from "@/pages/rider/PaymentPage";
import RatingPage from "@/pages/rider/RatingPage";
import WalletPage from "@/pages/rider/WalletPage";
import ProfilePage from "@/pages/rider/ProfilePage";
import DriverDashboard from "@/pages/driver/DriverDashboard";
import RideManagementPage from "@/pages/driver/RideManagementPage";
import EarningsInsightsPage from "@/pages/driver/EarningsInsightsPage";
import ProfileVerificationPage from "@/pages/driver/ProfileVerificationPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import NotFoundPage from "@/pages/NotFoundPage";

// OLA-Style Dashboards
import RiderDashboardOLA from "@/pages/rider/RiderDashboardOLA";
import DriverDashboardOLA from "@/pages/driver/DriverDashboardOLA";
import AdminDashboardOLA from "@/pages/admin/AdminDashboardOLA";
import RideTrackPage from "@/pages/rider/RideTrackPage";
import DriveRidePage from "@/pages/driver/DriveRidePage";
import RideDetailsPage from "@/pages/rider/RideDetailsPage";
import WalletOffersPage from "@/pages/rider/WalletOffersPage";
import ProfileSettingsPage from "@/pages/rider/ProfileSettingsPage";
import EarningsPage from "@/pages/driver/EarningsPage";
import UsersDriversPage from "@/pages/admin/UsersDriversPage";
import PaymentsCommissionPage from "@/pages/admin/PaymentsCommissionPage";
import OffersNotificationsPage from "@/pages/admin/OffersNotificationsPage";
import AnalyticsPage from "@/pages/admin/AnalyticsPage";
import SplashScreen from "@/pages/common/SplashScreen";
import OnboardingPage from "@/pages/common/OnboardingPage";
import ChargingStationsPage from "@/pages/common/ChargingStationsPage";
import LeaderboardPage from "@/pages/common/LeaderboardPage";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

// Note: using extracted ProtectedRoute component from components/

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={HomePage} />
      <Route path="/login">
        {user ? <Redirect to={`/${user.role}`} /> : <LoginPage />}
      </Route>

      {/* Rider Routes */}
      <Route path="/rider">
        <ProtectedRoute component={RiderDashboardOLA} allowedRoles={["rider"]} />
      </Route>
      <Route path="/rider/dashboard-simple">
        <ProtectedRoute component={RiderDashboard} allowedRoles={["rider"]} />
      </Route>
      <Route path="/rider/history">
        <ProtectedRoute component={RideHistoryPage} allowedRoles={["rider"]} />
      </Route>
      <Route path="/rider/rewards">
        <ProtectedRoute component={RewardsPage} allowedRoles={["rider"]} />
      </Route>
      <Route path="/rider/confirm">
        <ProtectedRoute component={ConfirmRidePage} allowedRoles={["rider"]} />
      </Route>
      <Route path="/rider/ride/:id/tracking">
        <ProtectedRoute component={RideTrackingPage} allowedRoles={["rider"]} />
      </Route>
      <Route path="/rider/payment">
        <ProtectedRoute component={PaymentPage} allowedRoles={["rider"]} />
      </Route>
      <Route path="/rider/rate">
        <ProtectedRoute component={RatingPage} allowedRoles={["rider"]} />
      </Route>
      <Route path="/rider/wallet">
        <ProtectedRoute component={WalletPage} allowedRoles={["rider"]} />
      </Route>
      <Route path="/rider/profile">
        <ProtectedRoute component={ProfilePage} allowedRoles={["rider"]} />
      </Route>
      <Route path="/rider/ride/:id">
        <ProtectedRoute component={RideTrackPage} allowedRoles={["rider"]} />
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
        <ProtectedRoute component={DriverDashboardOLA} allowedRoles={["driver"]} />
      </Route>
      <Route path="/driver/dashboard-simple">
        <ProtectedRoute component={DriverDashboard} allowedRoles={["driver"]} />
      </Route>
      <Route path="/driver/ride-management">
        <ProtectedRoute component={RideManagementPage} allowedRoles={["driver"]} />
      </Route>
      <Route path="/driver/ride/:id">
        <ProtectedRoute component={DriveRidePage} allowedRoles={["driver"]} />
      </Route>
      <Route path="/driver/earnings">
        <ProtectedRoute component={EarningsInsightsPage} allowedRoles={["driver"]} />
      </Route>
      <Route path="/driver/earnings-old">
        <ProtectedRoute component={EarningsPage} allowedRoles={["driver"]} />
      </Route>
      <Route path="/driver/profile">
        <ProtectedRoute component={ProfileVerificationPage} allowedRoles={["driver"]} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboardOLA} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin/dashboard-simple">
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
            <PWAInstallPrompt />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
