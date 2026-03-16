import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export default function AdminEmployees() {
  const [employees, setEmployees] = useState<Tables<"profiles">[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchEmployees = async () => {
    const { data: roleData } = await supabase.from("user_roles").select("user_id").eq("role", "employee");
    if (roleData && roleData.length > 0) {
      const ids = roleData.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", ids);
      setEmployees(profiles || []);
    } else {
      setEmployees([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchEmployees(); }, []);

  // Note: In production, you'd create the employee via an edge function
  // For now, admin can promote existing users by their email
  const addEmployee = async () => {
    toast.info("To add employees, create their accounts first, then use the database to assign the 'employee' role.");
    setAddOpen(false);
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
              <DialogTitle>Add Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To add an employee, first have them register as a citizen, then assign the employee role via the Cloud database.
              </p>
              <Button onClick={addEmployee} className="w-full">Got it</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : employees.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No employees found. Add the employee role to users via the Cloud database.
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
