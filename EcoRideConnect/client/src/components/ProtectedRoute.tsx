import { Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({
  component: Component,
  allowedRoles,
}: {
  component: React.ComponentType<any>;
  allowedRoles?: string[];
}) {
  const { user, loading } = useAuth();

  if (loading) return null; // parent can show a global loader
  if (!user) return <Redirect to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <div className="p-6">Unauthorized</div>;
  return <Component />;
}
