import type { Metadata } from "next";
import { getSettings } from "@/server/services/settings";
import { db } from "@/server/db";
import { whatsappOptions } from "@/lib/site";
import { PageHeader } from "@/components/site/PageHeader";
import { ContactForm } from "@/components/site/ContactForm";
import { ContactChannels } from "@/components/site/ContactChannels";
import { Button } from "@/components/ui/Button";
import styles from "./contato.module.css";

export const metadata: Metadata = {
  title: "Contato e orçamento",
  description: "Solicite um orçamento de móveis planejados sob medida. Fale com a Atlas Planejados.",
  alternates: { canonical: "/contato" },
};

type Props = { searchParams: Promise<{ projeto?: string }> };

export default async function ContactPage({ searchParams }: Props) {
  const { projeto } = await searchParams;
  const settings = await getSettings();

  // Vindo de uma página de projeto: já sugere a mensagem com o nome do projeto.
  let defaultMessage = "";
  if (projeto) {
    const p = await db.project.findFirst({ where: { slug: projeto, published: true, category: { isActive: true } }, select: { title: true } });
    if (p) defaultMessage = `Olá! Tenho interesse em um projeto como “${p.title}”.`;
  }

  const whatsapps = whatsappOptions(settings, defaultMessage || "Olá! Gostaria de solicitar um orçamento de móveis planejados.");
  const embed = settings.mapEmbedUrl;
  const hasChannels = !!(settings.whatsapp || settings.whatsapp2 || settings.phone || settings.email || settings.address || settings.openingHours || settings.instagram || settings.facebook);

  return (
    <>
      <PageHeader
        eyebrow="Contato"
        title="Vamos conversar sobre o seu projeto."
        lead="Conte o que você precisa. Retornamos para entender o espaço e explicar como funciona o projeto e o orçamento."
      />

      <section className={styles.section}>
        <div className={`container ${styles.grid}`}>
          <div className={styles.formCol}>
            <h2 className={styles.colTitle}>Solicitar orçamento</h2>
            <ContactForm defaultMessage={defaultMessage} />
          </div>

          <aside className={styles.infoCol} aria-label="Outros canais de contato">
            {whatsapps.length > 0 ? (
              <div className={styles.whatsapp}>
                <h2 className={styles.colTitle}>Prefere o WhatsApp?</h2>
                <p>{whatsapps.length > 1 ? "Chame a gente direto pelo aplicativo, em qualquer um dos dois números." : "Chame a gente direto pelo aplicativo."}</p>
                <div className={styles.whatsappButtons}>
                  {whatsapps.map((w) => (
                    <Button key={w.key} href={w.href} external icon="whatsapp">
                      {w.label === "WhatsApp" ? "Chamar no WhatsApp" : `${w.label} · ${w.number}`}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
            {hasChannels ? (
              <div>
                <h2 className={styles.colTitle}>Outros canais</h2>
                <ContactChannels settings={settings} />
              </div>
            ) : null}
          </aside>
        </div>

        {embed ? (
          <div className={`container ${styles.map}`}>
            <iframe
              src={embed}
              title="Localização da Atlas Planejados no mapa"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        ) : null}
      </section>
    </>
  );
}
