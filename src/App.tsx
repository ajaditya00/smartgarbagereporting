import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "@/components/DashboardLayout";

// Citizen pages
import ReportGarbage from "./pages/citizen/ReportGarbage";
import MyComplaints from "./pages/citizen/MyComplaints";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminComplaints from "./pages/admin/AdminComplaints";
import AdminEmployees from "./pages/admin/AdminEmployees";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

// Employee pages
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeTasks from "./pages/employee/EmployeeTasks";

import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

const queryClient = new QueryClient();

type AppRole = Database["public"]["Enums"]["app_role"];

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: AppRole }) {
  const { user, roles, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (requiredRole && !roles.includes(requiredRole)) return <Navigate to="/" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Index />} />

            {/* Citizen routes */}
            <Route path="/report" element={<ProtectedRoute><ReportGarbage /></ProtectedRoute>} />
            <Route path="/complaints" element={<ProtectedRoute><MyComplaints /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/complaints" element={<ProtectedRoute requiredRole="admin"><AdminComplaints /></ProtectedRoute>} />
            <Route path="/admin/employees" element={<ProtectedRoute requiredRole="admin"><AdminEmployees /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute requiredRole="admin"><AdminAnalytics /></ProtectedRoute>} />

            {/* Employee routes */}
            <Route path="/employee" element={<ProtectedRoute requiredRole="employee"><EmployeeDashboard /></ProtectedRoute>} />
            <Route path="/employee/tasks" element={<ProtectedRoute requiredRole="employee"><EmployeeTasks /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
