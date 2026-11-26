import { Badge } from "@/components/ui/badge";

export function DocStatusBadge({ status }: { status: string }) {
  const variant =
    status === "POSTED"
      ? "success"
      : status === "CANCELLED"
        ? "warning"
        : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}
