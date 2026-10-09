"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Account IDs are raw UUIDs and the only way to address a transfer today, so
 * copying one has to be effortless. A recipient lookup by email or phone would
 * remove the need for this entirely.
 */
export function CopyId({ value, label = "account ID" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* Clipboard denied (insecure origin, or the user said no) — the ID is still on screen. */
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <code className="font-mono text-xs text-muted-foreground">
        {value.slice(0, 8)}…{value.slice(-4)}
      </code>
      <Button variant="ghost" size="icon-xs" onClick={copy} aria-label={`Copy ${label}`}>
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </span>
  );
}
