import type { ApplicationStatus } from "@novi-dom/backend/enums";
import { Badge } from "@/components/ui/badge";
import { APPLICATION_STATUS_LABEL } from "@/lib/labels";

const VARIANT: Record<ApplicationStatus, "default" | "secondary" | "destructive" | "outline"> = {
  SUBMITTED: "secondary",
  IN_REVIEW: "secondary",
  VISIT_SCHEDULED: "secondary",
  VISIT_DONE: "secondary",
  APPROVED: "default",
  ADOPTED: "default",
  REJECTED: "destructive",
  WITHDRAWN: "outline",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge variant={VARIANT[status]}>{APPLICATION_STATUS_LABEL[status]}</Badge>;
}
