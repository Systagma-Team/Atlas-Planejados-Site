import type { Metadata, Viewport } from "next";
import "@/styles/tokens.css";
import "@/styles/base.css";
import { dmSans, fraunces } from "@/lib/fonts";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl, whatsappOptions } from "@/lib/site";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { WhatsAppFloat } from "@/components/site/WhatsAppFloat";
import { getActiveCategories } from "@/server/queries/public";
import { getSettings } from "@/server/services/settings";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${SITE_NAME} — Móveis planejados sob medida`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Móveis planejados sob medida`,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#f6f4f2",
  width: "device-width",
  initialScale: 1,
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getActiveCategories()]);

  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${fraunces.variable} ${dmSans.variable}`}>
      <body suppressHydrationWarning>
        <a href="#conteudo" className="skip-link">
          Ir para o conteúdo
        </a>
        <SiteHeader />
        <main id="conteudo">{children}</main>
        <SiteFooter settings={settings} categories={categories} />
        <WhatsAppFloat options={whatsappOptions(settings, "Olá! Vim pelo site da Atlas Planejados e gostaria de um orçamento.")} />
      </body>
    </html>
  );
}
