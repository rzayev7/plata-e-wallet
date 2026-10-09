import { redirect } from "next/navigation";

import { PlataMark } from "@/components/plata/plata-mark";
import { readSession } from "@/lib/server/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  /* Already signed in? There is nothing to do on these pages. */
  if (await readSession()) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <PlataMark />
          <p className="text-sm text-muted-foreground">Your money, in one place.</p>
        </div>
        {children}
      </div>
    </main>
  );
}
