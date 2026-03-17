import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, CheckCircle, Clock } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export default function EmployeeDashboard() {
  const { user, profile } = useAuth();
  const [assignments, setAssignments] = useState<(Tables<"assignments"> & { complaint?: Tables<"complaints"> })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("assignments")
      .select("*, complaints(*)")
      .eq("employee_id", user.id)
      .then(({ data }) => {
        const mapped = (data || []).map((a: Tables<"assignments"> & { complaints?: Tables<"complaints"> }) => ({
          ...a,
          complaint: a.complaints,
        }));
        setAssignments(mapped);
        setLoading(false);
      });
  }, [user]);

  const total = assignments.length;
  const completed = assignments.filter((a) => a.complaint?.status === "completed").length;
  const active = total - completed;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">
          Welcome, {profile?.full_name || "Employee"}!
        </h1>
        <p className="text-muted-foreground mt-1">Your assigned cleanup tasks</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-heading">{total}</p>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
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
                <p className="text-2xl font-bold font-heading">{active}</p>
                <p className="text-sm text-muted-foreground">Active</p>
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
                <p className="text-2xl font-bold font-heading">{completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
