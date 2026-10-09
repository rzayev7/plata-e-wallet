import { LockIcon, SnowflakeIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { AccountStatus } from "@/types/api";

/** FROZEN can still receive money but not send it; CLOSED can do neither. */
export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  if (status === "ACTIVE") {
    return <Badge variant="secondary">Active</Badge>;
  }
  if (status === "FROZEN") {
    return (
      <Badge variant="outline">
        <SnowflakeIcon />
        Frozen
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      <LockIcon />
      Closed
    </Badge>
  );
}

export function canReceive(status: AccountStatus): boolean {
  return status !== "CLOSED";
}

export function canSend(status: AccountStatus): boolean {
  return status === "ACTIVE";
}
