import Link from "next/link";
import { Logo } from "./Logo";
import { ContactChannels } from "./ContactChannels";
import type { SiteSettings } from "@/lib/content";
import styles from "./SiteFooter.module.css";

type Props = {
  settings: SiteSettings;
  categories: { id: string; name: string; slug: string }[];
};

export function SiteFooter({ settings, categories }: Props) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link href="/" aria-label="Atlas Planejados — página inicial">
            <Logo inverse />
          </Link>
          <p className={styles.tagline}>Móveis planejados sob medida, pensados para cada ambiente.</p>
        </div>

        <nav className={styles.col} aria-label="Rodapé">
          <h2 className={styles.heading}>Navegue</h2>
          <ul>
            <li><Link href="/">Início</Link></li>
            <li><Link href="/projetos">Projetos</Link></li>
            <li><Link href="/sobre">Sobre</Link></li>
            <li><Link href="/contato">Contato e orçamento</Link></li>
          </ul>
        </nav>

        {categories.length > 0 ? (
          <nav className={styles.col} aria-label="Categorias de projetos">
            <h2 className={styles.heading}>Projetos</h2>
            <ul>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/projetos/categoria/${c.slug}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className={styles.col}>
          <h2 className={styles.heading}>Fale com a Atlas</h2>
          <ContactChannels settings={settings} tone="dark" />
          {!settings.whatsapp && !settings.whatsapp2 && !settings.instagram && !settings.facebook && !settings.phone && !settings.email && !settings.address ? (
            <p className={styles.muted}>
              Veja <Link href="/contato" className={styles.inlineLink}>como falar com a gente</Link>.
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.legal}>
        <div className={styles.legalInner}>
          <p>© {new Date().getFullYear()} Atlas Planejados. Todos os direitos reservados.</p>
          <p className={styles.credit}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/systagma-logo.webp`} alt="" width={28} height={28} loading="lazy" />
            <span>
              Site desenvolvido pela <strong>Systagma</strong>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
