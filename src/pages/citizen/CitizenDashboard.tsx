import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, FileText, CheckCircle, Clock } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export default function CitizenDashboard() {
  const { user, profile } = useAuth();
  const [complaints, setComplaints] = useState<Tables<"complaints">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("complaints")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setComplaints(data || []);
        setLoading(false);
      });
  }, [user]);

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "pending").length,
    completed: complaints.filter((c) => c.status === "completed").length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
            Welcome, {profile?.full_name || "Citizen"}!
          </h1>
          <p className="text-muted-foreground mt-1">Report garbage and track cleanup progress</p>
        </div>
        <Link to="/report">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Report
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-heading">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary">
                <Clock className="h-6 w-6 text-status-pending" />
              </div>
              <div>
                <p className="text-2xl font-bold font-heading">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary">
                <CheckCircle className="h-6 w-6 text-status-completed" />
              </div>
              <div>
                <p className="text-2xl font-bold font-heading">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading">Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : complaints.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No reports yet. Start by reporting garbage in your area!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <Link key={c.id} to="/complaints" className="block">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.image_url}
                        alt="Complaint"
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium capitalize">{c.category} waste</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
