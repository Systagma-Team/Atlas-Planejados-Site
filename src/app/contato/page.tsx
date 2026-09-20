import type { Metadata } from "next";
import { getSettings } from "@/lib/content";
import { whatsappOptions } from "@/lib/site";
import { PageHeader } from "@/components/site/PageHeader";
import { ContactChannels, getChannels } from "@/components/site/ContactChannels";
import { Button } from "@/components/ui/Button";
import styles from "./contato.module.css";

export const metadata: Metadata = {
  title: "Contato e orçamento",
  description: "Peça um orçamento de móveis planejados sob medida pelo WhatsApp ou pelo Instagram da Atlas Planejados.",
  alternates: { canonical: "/contato" },
};

export default function ContactPage() {
  const settings = getSettings();
  const message = "Olá! Gostaria de solicitar um orçamento de móveis planejados.";

  const whatsapps = whatsappOptions(settings, message);
  const otherChannels = getChannels(settings, { withoutWhatsapp: true });
  const embed = settings.mapEmbedUrl;
  const hasOthers = otherChannels.length > 0;

  return (
    <>
      <PageHeader
        eyebrow="Contato"
        title="Vamos conversar sobre o seu projeto."
        lead="O caminho mais rápido é o WhatsApp: conte o que você precisa e, se puder, envie fotos e medidas do espaço."
      />

      <section className={styles.section}>
        <div className={`container ${styles.grid}`}>
          <div className={styles.primary}>
            <h2 className={styles.colTitle}>{whatsapps.length > 0 ? "Fale com a gente" : "Canais de contato"}</h2>
            {whatsapps.length > 0 ? (
              <>
                <p>{whatsapps.length > 1 ? "Chame em qualquer um dos dois números." : "Chame direto pelo aplicativo."}</p>
                <div className={styles.buttons}>
                  {whatsapps.map((w) => (
                    <Button key={w.key} href={w.href} external icon="whatsapp">
                      {w.label === "WhatsApp" ? "Chamar no WhatsApp" : `${w.label} · ${w.number}`}
                    </Button>
                  ))}
                  {settings.instagram ? (
                    <Button href={settings.instagram} external variant="secondary" icon="instagram">
                      Ver o Instagram
                    </Button>
                  ) : null}
                </div>
              </>
            ) : settings.instagram ? (
              <>
                <p>Acompanhe nossos projetos e fale com a gente pelo Instagram.</p>
                <div className={styles.buttons}>
                  <Button href={settings.instagram} external icon="instagram">
                    Abrir o Instagram
                  </Button>
                </div>
              </>
            ) : (
              <p>Em breve os canais de contato estarão disponíveis aqui.</p>
            )}
          </div>

          {hasOthers ? (
            <aside className={styles.others} aria-label="Outras informações de contato">
              <h2 className={styles.colTitle}>Outras informações</h2>
              <ContactChannels settings={settings} withoutWhatsapp withoutSocials />
            </aside>
          ) : null}
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
