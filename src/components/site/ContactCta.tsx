import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { whatsappLink } from "@/lib/site";
import type { SiteSettings } from "@/server/services/settings";
import { ContactChannels } from "./ContactChannels";
import styles from "./ContactCta.module.css";

/** Faixa final de conversão: chamada para orçamento + canais de contato já cadastrados no painel. */
export function ContactCta({ settings }: { settings: SiteSettings }) {
  const whatsapp = settings.whatsapp ? whatsappLink(settings.whatsapp, "Olá! Gostaria de solicitar um orçamento de móveis planejados.") : null;

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
            {whatsapp ? (
              <Button href={whatsapp} external variant="secondary" icon="whatsapp">
                Chamar no WhatsApp
              </Button>
            ) : null}
          </div>
        </Reveal>
        <Reveal delay={120} className={styles.channels}>
          <ContactChannels settings={settings} tone="light" />
        </Reveal>
      </div>
    </section>
  );
}
