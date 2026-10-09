import { formatMinor } from "@/lib/money";
import type { Account, Currency } from "@/types/api";

/**
 * Totals per currency. Deliberately not one grand total: the backend has no FX
 * rates, and inventing a conversion in the browser would be a lie about money.
 */
export function BalanceSummary({ accounts }: { accounts: Account[] }) {
  const totals = new Map<Currency, number>();

  for (const account of accounts) {
    if (account.status === "CLOSED" || !Number.isFinite(account.balanceMinor)) {
      continue;
    }
    totals.set(account.currency, (totals.get(account.currency) ?? 0) + account.balanceMinor);
  }

  if (totals.size === 0) {
    return null;
  }

  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-3">
      {[...totals].map(([currency, minor]) => (
        <div key={currency}>
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{currency}</dt>
          <dd className="text-2xl font-semibold tracking-tight tabular-nums">{formatMinor(minor, currency)}</dd>
        </div>
      ))}
    </dl>
  );
}
