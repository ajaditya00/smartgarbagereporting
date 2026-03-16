import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import CitizenDashboard from "./citizen/CitizenDashboard";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function Index() {
  const { user, roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (roles.includes("admin")) return <Navigate to="/admin" replace />;
  if (roles.includes("employee")) return <Navigate to="/employee" replace />;

  return (
    <DashboardLayout>
      <CitizenDashboard />
    </DashboardLayout>
  );
}
