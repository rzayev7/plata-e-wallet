import { AccountsOverview } from "@/components/plata/accounts-overview";
import { readSession } from "@/lib/server/session";

export default async function DashboardPage() {
  const session = await readSession();

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {session?.firstName ? `Hello, ${session.firstName}` : "Your accounts"}
        </h1>
        <p className="text-sm text-muted-foreground">Balances update as soon as a transfer settles.</p>
      </div>

      <AccountsOverview />
    </div>
  );
}
