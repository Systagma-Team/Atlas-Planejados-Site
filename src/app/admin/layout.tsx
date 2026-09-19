import type { Metadata, Viewport } from "next";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/admin.css";
import { dmSans, fraunces } from "@/lib/fonts";

export const metadata: Metadata = {
  title: { default: "Painel Atlas", template: "%s · Painel Atlas" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body className="admin">{children}</body>
    </html>
  );
}
