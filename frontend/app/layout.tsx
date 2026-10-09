import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Plata",
  description: "A digital wallet — accounts, deposits and transfers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
     * suppressHydrationWarning on both: next-themes sets the class on <html>
     * before React hydrates, and browser extensions (password managers,
     * ColorZilla's cz-shortcut-listen, Grammarly) commonly stamp attributes on
     * <body> in the same window. It is shallow — it covers only these two
     * elements' own attributes, so a real mismatch inside the app still warns.
     */
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full bg-background antialiased`}
    >
      <body suppressHydrationWarning className="flex min-h-full flex-col bg-muted/40">
        <Providers>{children}</Providers>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
