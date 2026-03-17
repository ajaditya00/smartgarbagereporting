import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { UserPlus, Filter } from "lucide-react";
import type { Tables, Database } from "@/integrations/supabase/types";
import { Constants } from "@/integrations/supabase/types";

type Complaint = Tables<"complaints">;
type Profile = Tables<"profiles">;

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [compRes, empRes] = await Promise.all([
      supabase.from("complaints").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id").eq("role", "employee"),
    ]);

    setComplaints(compRes.data || []);

    if (empRes.data && empRes.data.length > 0) {
      const ids = empRes.data.map((e) => e.user_id);
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", ids);
      setEmployees(profiles || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const assignEmployee = async (complaintId: string, employeeId: string) => {
    const { error: assignErr } = await supabase.from("assignments").insert({
      complaint_id: complaintId,
      employee_id: employeeId,
    });
    if (assignErr) {
      toast.error("Assignment failed: " + assignErr.message);
      return;
    }
    const { error: updateErr } = await supabase
      .from("complaints")
      .update({ status: "assigned" })
      .eq("id", complaintId);
    if (updateErr) {
      toast.error("Status update failed");
    } else {
      toast.success("Employee assigned!");
      fetchData();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("complaints").update({ status: status as Database["public"]["Enums"]["complaint_status"] }).eq("id", id);
    if (error) toast.error("Update failed");
    else { toast.success("Status updated"); fetchData(); }
  };

  const filtered = complaints.filter((c) => {
    if (filterCategory !== "all" && c.category !== filterCategory) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-heading font-bold">All Complaints</h1>
        <div className="flex gap-2 flex-wrap">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-36">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Constants.public.Enums.garbage_category.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Constants.public.Enums.complaint_status.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No complaints found.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <img src={c.image_url} alt="Complaint" className="w-full md:w-36 h-36 rounded-lg object-cover" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-medium capitalize">{c.category} waste</p>
                        <p className="text-sm text-muted-foreground">{c.address || `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
                    <p className="text-xs text-muted-foreground">
                      Reported: {new Date(c.created_at).toLocaleString()}
                    </p>

                    <div className="flex gap-2 flex-wrap pt-2">
                      {c.status === "pending" && (
                        <>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" className="gap-1">
                                <UserPlus className="h-3 w-3" /> Assign
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Assign Employee</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3">
                                {employees.length === 0 ? (
                                  <p className="text-muted-foreground text-sm">No employees registered yet.</p>
                                ) : (
                                  employees.map((emp) => (
                                    <Button
                                      key={emp.user_id}
                                      variant="outline"
                                      className="w-full justify-start"
                                      onClick={() => assignEmployee(c.id, emp.user_id)}
                                    >
                                      {emp.full_name || "Unnamed Employee"}
                                    </Button>
                                  ))
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" variant="destructive" onClick={() => updateStatus(c.id, "rejected")}>
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
