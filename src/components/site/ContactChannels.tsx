import { Icon, type IconName } from "@/components/ui/Icon";
import { telLink, whatsappLink } from "@/lib/site";
import type { SiteSettings } from "@/server/services/settings";
import styles from "./ContactChannels.module.css";

type Channel = { key: string; icon: IconName; label: string; value: string; href?: string; external?: boolean };

/** Lista apenas os canais que o administrador já preencheu. Nada é exibido por padrão. */
export function getChannels(s: SiteSettings): Channel[] {
  const channels: (Channel | null)[] = [
    s.whatsapp ? { key: "whatsapp", icon: "whatsapp", label: "WhatsApp", value: s.whatsapp, href: whatsappLink(s.whatsapp) ?? undefined, external: true } : null,
    s.phone ? { key: "phone", icon: "phone", label: "Telefone", value: s.phone, href: telLink(s.phone) ?? undefined } : null,
    s.email ? { key: "email", icon: "mail", label: "E-mail", value: s.email, href: `mailto:${s.email}` } : null,
    s.address ? { key: "address", icon: "pin", label: "Endereço", value: s.address } : null,
    s.openingHours ? { key: "hours", icon: "clock", label: "Atendimento", value: s.openingHours } : null,
  ];
  return channels.filter((c): c is Channel => c !== null);
}

export function getSocials(s: SiteSettings) {
  return [
    s.instagram ? { key: "instagram", icon: "instagram" as const, label: "Instagram", href: s.instagram } : null,
    s.facebook ? { key: "facebook", icon: "facebook" as const, label: "Facebook", href: s.facebook } : null,
  ].filter((c): c is NonNullable<typeof c> => c !== null);
}

export function ContactChannels({ settings, tone = "light" }: { settings: SiteSettings; tone?: "light" | "dark" }) {
  const channels = getChannels(settings);
  const socials = getSocials(settings);
  if (channels.length === 0 && socials.length === 0) return null;

  return (
    <div className={[styles.root, tone === "dark" ? styles.dark : ""].join(" ")}>
      <ul className={styles.list}>
        {channels.map((c) => (
          <li key={c.key} className={styles.item}>
            <Icon name={c.icon} size={20} className={styles.icon} />
            <div>
              <span className={styles.label}>{c.label}</span>
              {c.href ? (
                <a className={styles.value} href={c.href} {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  {c.value}
                </a>
              ) : (
                <span className={styles.value}>{c.value}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
      {socials.length > 0 ? (
        <ul className={styles.socials} aria-label="Redes sociais">
          {socials.map((s) => (
            <li key={s.key}>
              <a className={styles.social} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${s.label} (abre em nova aba)`}>
                <Icon name={s.icon} size={20} />
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
