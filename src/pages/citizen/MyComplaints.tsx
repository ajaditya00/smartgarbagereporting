import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Star, MessageSquare } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export default function MyComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Tables<"complaints">[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, Tables<"feedback">>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    const [compRes, fbRes] = await Promise.all([
      supabase.from("complaints").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("feedback").select("*").eq("user_id", user.id),
    ]);
    setComplaints(compRes.data || []);
    const map: Record<string, Tables<"feedback">> = {};
    (fbRes.data || []).forEach((f) => (map[f.complaint_id] = f));
    setFeedbackMap(map);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-heading font-bold">My Complaints</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : complaints.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No complaints submitted yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {complaints.map((c) => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              feedback={feedbackMap[c.id]}
              userId={user!.id}
              onFeedbackSubmitted={fetchData}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ComplaintCard({
  complaint: c,
  feedback,
  userId,
  onFeedbackSubmitted,
}: {
  complaint: Tables<"complaints">;
  feedback?: Tables<"feedback">;
  userId: string;
  onFeedbackSubmitted: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const submitFeedback = async () => {
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      complaint_id: c.id,
      user_id: userId,
      rating,
      comment,
    });
    if (error) {
      toast.error("Failed to submit feedback");
    } else {
      toast.success("Feedback submitted!");
      setOpen(false);
      onFeedbackSubmitted();
    }
    setSubmitting(false);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <img src={c.image_url} alt="Complaint" className="w-full sm:w-32 h-32 rounded-lg object-cover" />
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium capitalize">{c.category} waste</p>
                <p className="text-sm text-muted-foreground">{c.address || `${c.latitude}, ${c.longitude}`}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
            {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
            <p className="text-xs text-muted-foreground">
              Reported: {new Date(c.created_at).toLocaleString()}
            </p>

            {c.completion_image_url && (
              <div className="mt-2">
                <p className="text-xs font-medium text-primary mb-1">Completion Photo:</p>
                <img src={c.completion_image_url} alt="Completed" className="w-24 h-24 rounded-lg object-cover" />
              </div>
            )}

            {/* Feedback */}
            {c.status === "completed" && !feedback && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary" className="gap-1 mt-2">
                    <MessageSquare className="h-3 w-3" /> Give Feedback
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rate this cleanup</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} type="button" onClick={() => setRating(s)}>
                          <Star className={`h-8 w-8 ${s <= rating ? "fill-accent text-accent" : "text-muted"}`} />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      placeholder="Optional comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <Button onClick={submitFeedback} disabled={submitting} className="w-full">
                      {submitting ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {feedback && (
              <div className="flex items-center gap-2 mt-2 text-sm">
                <span className="text-muted-foreground">Your rating:</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= feedback.rating ? "fill-accent text-accent" : "text-muted"}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
