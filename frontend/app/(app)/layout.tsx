import { redirect } from "next/navigation";

import { AppHeader } from "@/components/plata/app-header";
import { readSession } from "@/lib/server/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();

  /*
   * The guard is the presence of the refresh cookie. The access token may
   * already have expired — the proxy renews it on the first API call.
   */
  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <AppHeader session={session} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
