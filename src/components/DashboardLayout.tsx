import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Recycle, LogOut, LayoutDashboard, FileText, Users, BarChart3, ClipboardList, Plus,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const navByRole: Record<AppRole, NavItem[]> = {
  citizen: [
    { label: "Dashboard", href: "/", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "New Report", href: "/report", icon: <Plus className="h-4 w-4" /> },
    { label: "My Complaints", href: "/complaints", icon: <FileText className="h-4 w-4" /> },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "All Complaints", href: "/admin/complaints", icon: <FileText className="h-4 w-4" /> },
    { label: "Employees", href: "/admin/employees", icon: <Users className="h-4 w-4" /> },
    { label: "Analytics", href: "/admin/analytics", icon: <BarChart3 className="h-4 w-4" /> },
  ],
  employee: [
    { label: "Dashboard", href: "/employee", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "My Tasks", href: "/employee/tasks", icon: <ClipboardList className="h-4 w-4" /> },
  ],
};

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeRole: AppRole = roles.includes("admin")
    ? "admin"
    : roles.includes("employee")
    ? "employee"
    : "citizen";

  const navItems = navByRole[activeRole];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="p-6 flex items-center gap-2">
          <Recycle className="h-7 w-7 text-sidebar-primary" />
          <span className="text-lg font-heading font-bold text-sidebar-foreground">CleanCity</span>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-bold text-sidebar-primary">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.full_name || "User"}
              </p>
              <p className="text-xs text-sidebar-foreground/50 capitalize">{activeRole}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Recycle className="h-6 w-6 text-primary" />
            <span className="font-heading font-bold text-foreground">CleanCity</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        {/* Mobile nav */}
        <nav className="md:hidden flex overflow-x-auto border-b border-border bg-card px-2">
          {navItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2 px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
