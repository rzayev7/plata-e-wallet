import { HistoryIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

/*
 * Placeholder on purpose.
 *
 * Transfers ARE persisted (transfer/entity/Transfer.java, migration V9), but
 * nothing reads them back: TransferRepository has no query method and no
 * controller exposes one. This page stays a stub until the backend offers
 * something like:
 *
 *   GET /accounts/{accountId}/transactions?page=0&size=20
 *     -> Page<{ id, direction, counterpartyAccountId, amount, currency, createdAt }>
 *
 * Once that lands, swap this for a TanStack Query infinite list.
 */
export default function ActivityPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-muted-foreground">Every deposit, withdrawal and transfer.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
            <HistoryIcon className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="font-medium">Waiting on the API</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Transfers are already recorded in the database, but there is no endpoint to read them
              yet. Add <code className="font-mono">GET /accounts/{"{id}"}/transactions</code> and this
              page can be wired up in minutes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
