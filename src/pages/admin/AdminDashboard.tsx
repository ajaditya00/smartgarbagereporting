import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, CheckCircle, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState<Tables<"complaints">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setComplaints(data || []);
        setLoading(false);
      });
  }, []);

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "pending").length,
    assigned: complaints.filter((c) => c.status === "assigned" || c.status === "in_progress").length,
    completed: complaints.filter((c) => c.status === "completed").length,
    rejected: complaints.filter((c) => c.status === "rejected").length,
  };

  const statCards = [
    { label: "Total Complaints", value: stats.total, icon: FileText, color: "text-primary" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-status-pending" },
    { label: "In Progress", value: stats.assigned, icon: TrendingUp, color: "text-status-in-progress" },
    { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-status-completed" },
    { label: "Rejected", value: stats.rejected, icon: AlertTriangle, color: "text-status-rejected" },
  ];

  // Category breakdown
  const catCounts: Record<string, number> = {};
  complaints.forEach((c) => {
    catCounts[c.category] = (catCounts[c.category] || 0) + 1;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl md:text-3xl font-heading font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-2">
                <s.icon className={`h-8 w-8 ${s.color}`} />
                <p className="text-2xl font-bold font-heading">{loading ? "–" : s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(catCounts).map(([cat, count]) => (
                <div key={cat} className="p-3 rounded-lg bg-muted text-center">
                  <p className="text-lg font-bold font-heading">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">{cat}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
