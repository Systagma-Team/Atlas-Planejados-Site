import Link from "next/link";
import { Logo } from "./Logo";
import { ContactChannels } from "./ContactChannels";
import type { SiteSettings } from "@/server/services/settings";
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
                  <Link href={`/projetos?categoria=${c.slug}`}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className={styles.col}>
          <h2 className={styles.heading}>Fale com a Atlas</h2>
          <ContactChannels settings={settings} tone="dark" />
          {!settings.whatsapp && !settings.phone && !settings.email && !settings.address ? (
            <p className={styles.muted}>
              <Link href="/contato" className={styles.inlineLink}>Envie uma mensagem</Link> pelo formulário de orçamento.
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.legal}>
        <p>© {new Date().getFullYear()} Atlas Planejados. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
