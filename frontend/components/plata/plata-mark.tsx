import { WalletIcon } from "lucide-react";

import { cn } from "cn";

/** The wordmark. Deliberately plain — a real brand asset can replace it later. */
export function PlataMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-xl font-semibold tracking-tight", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <WalletIcon className="size-4" />
      </span>
      Plata
    </span>
  );
}
