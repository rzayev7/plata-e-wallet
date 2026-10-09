"use client";

import { useState } from "react";
import { ArrowDownLeftIcon, ArrowUpRightIcon, SendIcon } from "lucide-react";

import { AccountStatusBadge, canReceive, canSend } from "@/components/plata/account-status-badge";
import { CopyId } from "@/components/plata/copy-id";
import { MoveMoneyDialog, type MoveMoneyAction } from "@/components/plata/move-money-dialog";
import { TransferDialog } from "@/components/plata/transfer-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMinorPlain } from "@/lib/money";
import type { Account } from "@/types/api";

export function AccountCard({ account }: { account: Account }) {
  const [moveMoney, setMoveMoney] = useState<MoveMoneyAction | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {account.currency} account
          </CardTitle>
          <CardAction>
            <AccountStatusBadge status={account.status} />
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-1">
          <p className="text-3xl font-semibold tracking-tight tabular-nums">
            {formatMinorPlain(account.balanceMinor)}
            <span className="ml-1.5 text-base font-normal text-muted-foreground">{account.currency}</span>
          </p>
          <CopyId value={account.id} />
        </CardContent>

        <CardFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => setMoveMoney("deposit")} disabled={!canReceive(account.status)}>
            <ArrowDownLeftIcon />
            Add
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMoveMoney("withdraw")} disabled={!canSend(account.status)}>
            <ArrowUpRightIcon />
            Withdraw
          </Button>
          <Button size="sm" onClick={() => setTransferOpen(true)} disabled={!canSend(account.status)}>
            <SendIcon />
            Send
          </Button>
        </CardFooter>
      </Card>

      {moveMoney && (
        <MoveMoneyDialog
          account={account}
          action={moveMoney}
          open
          onOpenChange={(open) => !open && setMoveMoney(null)}
        />
      )}

      {/* Mounted only while open, so each dialog starts from a clean form. */}
      {transferOpen && <TransferDialog account={account} open onOpenChange={setTransferOpen} />}
    </>
  );
}
