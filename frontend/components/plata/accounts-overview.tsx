"use client";

import { useState } from "react";
import { PlusIcon, WalletIcon } from "lucide-react";

import { AccountCard } from "@/components/plata/account-card";
import { BalanceSummary } from "@/components/plata/balance-summary";
import { CreateAccountDialog } from "@/components/plata/create-account-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccounts } from "@/hooks/use-accounts";
import { messageOf } from "@/lib/api-client";

export function AccountsOverview() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: accounts, isPending, isError, error, refetch } = useAccounts();

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        {isPending ? <Skeleton className="h-14 w-40" /> : <BalanceSummary accounts={accounts ?? []} />}
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          Open account
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load your accounts</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-2">
            {messageOf(error)}
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isPending && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      )}

      {accounts && accounts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
              <WalletIcon className="size-5" />
            </span>
            <div className="space-y-1">
              <p className="font-medium">No accounts yet</p>
              <p className="text-sm text-muted-foreground">
                Open one to start adding money and sending transfers.
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon />
              Open your first account
            </Button>
          </CardContent>
        </Card>
      )}

      {accounts && accounts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}

      {createOpen && (
        <CreateAccountDialog
          open
          onOpenChange={setCreateOpen}
          takenCurrencies={(accounts ?? []).map((account) => account.currency)}
        />
      )}
    </section>
  );
}
