import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["complaint_status"];

const statusConfig: Record<Status, { label: string; className: string }> = {
  pending: { label: "Pending", className: "status-badge-pending" },
  assigned: { label: "Assigned", className: "status-badge-assigned" },
  in_progress: { label: "In Progress", className: "status-badge-in-progress" },
  completed: { label: "Completed", className: "status-badge-completed" },
  rejected: { label: "Rejected", className: "status-badge-rejected" },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  return (
    <Badge variant="secondary" className={`${config.className} font-medium border-0`}>
      {config.label}
    </Badge>
  );
}
