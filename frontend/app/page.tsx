import { redirect } from "next/navigation";

import { readSession } from "@/lib/server/session";

export default async function HomePage() {
  redirect((await readSession()) ? "/dashboard" : "/login");
}
