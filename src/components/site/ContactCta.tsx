import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { whatsappOptions } from "@/lib/site";
import type { SiteSettings } from "@/lib/content";
import { ContactChannels } from "./ContactChannels";
import styles from "./ContactCta.module.css";

/** Faixa final de conversão: chamada para orçamento + canais de contato já cadastrados no painel. */
export function ContactCta({ settings }: { settings: SiteSettings }) {
  const whatsapps = whatsappOptions(settings, "Olá! Gostaria de solicitar um orçamento de móveis planejados.");

  return (
    <section className={styles.section} aria-labelledby="cta-title">
      <div className={`container ${styles.grid}`}>
        <Reveal>
          <p className="eyebrow">Orçamento</p>
          <h2 id="cta-title" className={`display ${styles.title}`}>
            Vamos planejar o seu ambiente?
          </h2>
          <p className={styles.lead}>Conte o que você tem em mente. Retornamos para entender o espaço e apresentar o caminho do projeto.</p>
          <div className={styles.actions}>
            <Button href="/contato" variant="primary" icon="arrow">
              Solicitar orçamento
            </Button>
            {whatsapps.map((w) => (
              <Button key={w.key} href={w.href} external variant="secondary" icon="whatsapp">
                {w.label === "WhatsApp" ? "Chamar no WhatsApp" : `WhatsApp ${w.label.toLowerCase()}`}
              </Button>
            ))}
          </div>
        </Reveal>
        <Reveal delay={120} className={styles.channels}>
          <ContactChannels settings={settings} tone="light" />
        </Reveal>
      </div>
    </section>
  );
}
