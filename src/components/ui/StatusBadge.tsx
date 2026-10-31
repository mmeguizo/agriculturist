import { IncidentStatus, UserStatus } from "@/lib/types";

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  const styles: Record<IncidentStatus, string> = {
    pending: "badge-pending",
    under_review: "badge-review",
    resolved: "badge-resolved",
  };
  const labels: Record<IncidentStatus, string> = {
    pending: "Pending Review",
    under_review: "Under Review",
    resolved: "Resolved",
  };
  return <span className={styles[status] || "badge-pending"}>{labels[status] || status}</span>;
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const styles: Record<UserStatus, string> = {
    pending: "badge-pending",
    approved: "badge-resolved",
    rejected:
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800",
  };
  const labels: Record<UserStatus, string> = {
    pending: "Pending Approval",
    approved: "Approved",
    rejected: "Rejected",
  };
  return <span className={styles[status] || "badge-pending"}>{labels[status] || status}</span>;
}
