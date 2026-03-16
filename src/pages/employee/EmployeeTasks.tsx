import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { Camera, CheckCircle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type AssignmentWithComplaint = Tables<"assignments"> & { complaint: Tables<"complaints"> };

export default function EmployeeTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AssignmentWithComplaint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("assignments")
      .select("*, complaints(*)")
      .eq("employee_id", user.id)
      .order("assigned_at", { ascending: false });

    const mapped = (data || []).map((a: any) => ({
      ...a,
      complaint: a.complaints,
    }));
    setTasks(mapped);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [user]);

  const updateStatus = async (complaintId: string, status: string) => {
    const { error } = await supabase
      .from("complaints")
      .update({ status: status as any })
      .eq("id", complaintId);
    if (error) {
      toast.error("Update failed: " + error.message);
    } else {
      toast.success("Status updated!");
      fetchTasks();
    }
  };

  const uploadCompletionPhoto = async (complaintId: string, file: File) => {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `completions/${user.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("complaint-images").upload(path, file);
    if (uploadErr) {
      toast.error("Upload failed");
      return;
    }
    const { data: urlData } = supabase.storage.from("complaint-images").getPublicUrl(path);
    const { error } = await supabase
      .from("complaints")
      .update({ completion_image_url: urlData.publicUrl, status: "completed" })
      .eq("id", complaintId);
    if (error) {
      toast.error("Failed to update complaint");
    } else {
      toast.success("Completion photo uploaded & task completed!");
      fetchTasks();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-heading font-bold">My Tasks</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No tasks assigned yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <img
                    src={t.complaint.image_url}
                    alt="Task"
                    className="w-full md:w-36 h-36 rounded-lg object-cover"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-medium capitalize">{t.complaint.category} waste</p>
                        <p className="text-sm text-muted-foreground">
                          {t.complaint.address || `${t.complaint.latitude.toFixed(4)}, ${t.complaint.longitude.toFixed(4)}`}
                        </p>
                      </div>
                      <StatusBadge status={t.complaint.status} />
                    </div>
                    {t.complaint.description && (
                      <p className="text-sm text-muted-foreground">{t.complaint.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Assigned: {new Date(t.assigned_at).toLocaleString()}
                    </p>

                    {t.complaint.completion_image_url && (
                      <div>
                        <p className="text-xs font-medium text-primary mb-1">Completion Photo:</p>
                        <img
                          src={t.complaint.completion_image_url}
                          alt="Completed"
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      </div>
                    )}

                    {t.complaint.status !== "completed" && t.complaint.status !== "rejected" && (
                      <div className="flex gap-2 flex-wrap pt-2">
                        {t.complaint.status === "assigned" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => updateStatus(t.complaint.id, "in_progress")}
                          >
                            Start Working
                          </Button>
                        )}
                        {t.complaint.status === "in_progress" && (
                          <label>
                            <Button size="sm" className="gap-1 cursor-pointer" asChild>
                              <span>
                                <Camera className="h-3 w-3" /> Upload & Complete
                              </span>
                            </Button>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadCompletionPhoto(t.complaint.id, file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    )}
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
