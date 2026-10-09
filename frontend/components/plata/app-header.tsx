"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { LogOutIcon } from "lucide-react";

import { PlataMark } from "@/components/plata/plata-mark";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api-client";
import { cn } from "cn";
import type { SessionProfile } from "@/types/api";

const NAV = [
  { href: "/dashboard", label: "Accounts" },
  { href: "/activity", label: "Activity" },
] as const;

export function AppHeader({ session }: { session: SessionProfile }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const signOut = useMutation({
    mutationFn: () => api<{ ok: true }>("/auth/logout", { method: "POST" }),
    onSettled: () => {
      /* Drop cached balances before leaving, whatever the backend answered. */
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    },
  });

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-3 sm:gap-6 sm:px-6">
        <Link href="/dashboard" aria-label="Plata home">
          <PlataMark className="text-base" />
        </Link>

        <nav className="flex min-w-0 items-center gap-0.5 sm:gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-2 py-1.5 text-sm font-medium whitespace-nowrap transition-colors sm:px-2.5",
                pathname === item.href
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-3">
          <span className="hidden truncate text-sm text-muted-foreground md:inline">{session.email}</span>
          {/* Icon-only on phones, where the header has no room for the label. */}
          <Button
            variant="outline"
            size="sm"
            aria-label="Sign out"
            onClick={() => signOut.mutate()}
            disabled={signOut.isPending}
          >
            {signOut.isPending ? <Spinner /> : <LogOutIcon />}
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
