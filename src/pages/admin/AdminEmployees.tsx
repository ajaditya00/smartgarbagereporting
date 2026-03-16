import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus, UserCheck } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export default function AdminEmployees() {
  const [employees, setEmployees] = useState<Tables<"profiles">[]>([]);
  const [citizens, setCitizens] = useState<Tables<"profiles">[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchData = async () => {
    const [empRoleData, citRoleData] = await Promise.all([
      supabase.from("user_roles").select("user_id").eq("role", "employee"),
      supabase.from("user_roles").select("user_id").eq("role", "citizen"),
    ]);

    const empIds = empRoleData.data?.map(r => r.user_id) || [];
    const citIds = citRoleData.data?.map(r => r.user_id) || [];

    const [empProfiles, citProfiles] = await Promise.all([
      empIds.length > 0 ? supabase.from("profiles").select("*").in("user_id", empIds) : Promise.resolve({ data: [] }),
      citIds.length > 0 ? supabase.from("profiles").select("*").in("user_id", citIds) : Promise.resolve({ data: [] }),
    ]);

    setEmployees(empProfiles.data || []);
    setCitizens(citProfiles.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const promoteToEmployee = async (userId: string) => {
    setAdding(true);
    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: "employee",
    });
    if (error) {
      toast.error("Failed to promote user: " + error.message);
    } else {
      toast.success("User promoted to employee!");
      fetchData();
    }
    setAdding(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Employees</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" /> Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Promote Citizen to Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {citizens.length === 0 ? (
                <p className="text-muted-foreground text-sm">No citizens available to promote.</p>
              ) : (
                citizens.map((cit) => (
                  <div key={cit.user_id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{cit.full_name || "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground">{cit.phone || "No phone"}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => promoteToEmployee(cit.user_id)}
                      disabled={adding}
                    >
                      <UserCheck className="h-3 w-3 mr-1" /> Promote
                    </Button>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : employees.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No employees found. Promote citizens to employees.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((emp) => (
            <Card key={emp.id}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-primary">
                    {emp.full_name?.charAt(0)?.toUpperCase() || "E"}
                  </div>
                  <div>
                    <p className="font-medium">{emp.full_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{emp.phone || "No phone"}</p>
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
