import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { Tables } from "@/integrations/supabase/types";

const COLORS = ["hsl(152,60%,36%)", "hsl(38,92%,50%)", "hsl(217,91%,60%)", "hsl(262,83%,58%)", "hsl(0,72%,51%)", "hsl(180,60%,45%)", "hsl(300,50%,50%)"];

export default function AdminAnalytics() {
  const [complaints, setComplaints] = useState<Tables<"complaints">[]>([]);
  const [feedback, setFeedback] = useState<Tables<"feedback">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("complaints").select("*"),
      supabase.from("feedback").select("*"),
    ]).then(([compRes, fbRes]) => {
      setComplaints(compRes.data || []);
      setFeedback(fbRes.data || []);
      setLoading(false);
    });
  }, []);

  // Category data for pie chart
  const catCounts: Record<string, number> = {};
  complaints.forEach((c) => {
    catCounts[c.category] = (catCounts[c.category] || 0) + 1;
  });
  const pieData = Object.entries(catCounts).map(([name, value]) => ({ name, value }));

  // Status data for bar chart
  const statusCounts: Record<string, number> = {};
  complaints.forEach((c) => {
    const label = c.status.replace("_", " ");
    statusCounts[label] = (statusCounts[label] || 0) + 1;
  });
  const barData = Object.entries(statusCounts).map(([name, count]) => ({ name, count }));

  // Average rating
  const avgRating = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : "N/A";

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-heading font-bold">Analytics</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold font-heading">{complaints.length}</p>
                <p className="text-sm text-muted-foreground">Total Complaints</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold font-heading">{feedback.length}</p>
                <p className="text-sm text-muted-foreground">Feedback Received</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold font-heading">⭐ {avgRating}</p>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading">Complaints by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(152,60%,36%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-heading">Complaints by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
