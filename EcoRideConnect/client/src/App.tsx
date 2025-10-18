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

      {/* Driver Routes */}
      <Route path="/driver">
        <ProtectedRoute component={DriverDashboard} allowedRoles={["driver"]} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />
      </Route>

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
