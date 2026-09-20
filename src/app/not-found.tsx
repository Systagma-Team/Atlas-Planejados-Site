import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import styles from "./not-found.module.css";

export const metadata: Metadata = { title: "Página não encontrada", robots: { index: false } };

export default function NotFound() {
  return (
    <section className={styles.section}>
      <div className="container">
        <p className="eyebrow">Erro 404</p>
        <h1 className={`display ${styles.title}`}>Não encontramos esta página.</h1>
        <p className={styles.text}>O endereço pode ter mudado ou o projeto não está mais disponível.</p>
        <div className={styles.actions}>
          <Button href="/projetos" icon="arrow">
            Ver projetos
          </Button>
          <Button href="/" variant="secondary">
            Ir para o início
          </Button>
        </div>
      </div>
    </section>
  );
}
