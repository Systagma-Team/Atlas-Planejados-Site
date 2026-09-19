import type { ReactNode } from "react";
import styles from "./PageHeader.module.css";

type Props = {
  eyebrow: string;
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
};

/** Cabeçalho padrão das páginas internas. Único <h1> da página. */
export function PageHeader({ eyebrow, title, lead, children }: Props) {
  return (
    <header className={styles.header}>
      <div className="container">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className={`display ${styles.title}`}>{title}</h1>
        {lead ? <p className={styles.lead}>{lead}</p> : null}
        {children}
      </div>
    </header>
  );
}
