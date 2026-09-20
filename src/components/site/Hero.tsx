import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Picture } from "@/components/ui/Picture";
import type { ProjectCardData } from "@/lib/content";
import styles from "./Hero.module.css";

/** Hero da Home. A foto vem do primeiro projeto em destaque cadastrado no painel. */
export function Hero({ project }: { project: ProjectCardData | null }) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      {project ? (
        <>
          <Picture image={project.cover} sizes="100vw" fill priority position="50% 55%" alt="" />
          <div className={styles.shade} aria-hidden="true" />
        </>
      ) : (
        <div className={styles.plain} aria-hidden="true" />
      )}

      <div className={styles.content}>
        <p className={styles.eyebrow}>Atlas Planejados</p>
        <h1 id="hero-title" className={`display ${styles.title}`}>
          Móveis planejados que transformam ambientes.
        </h1>
        <p className={styles.lead}>
          Projetos sob medida, pensados para o espaço e para a rotina de quem vive nele — com atenção ao acabamento em cada detalhe.
        </p>
        <div className={styles.actions}>
          <Button href="/projetos" variant="light" icon="arrow">
            Ver projetos
          </Button>
          <Button href="/contato" variant="ghost-light">
            Solicitar orçamento
          </Button>
        </div>
      </div>

      {project ? (
        <Link href={`/projetos/${project.slug}`} className={styles.caption}>
          <span className={styles.captionLabel}>Projeto em destaque</span>
          <span className={styles.captionTitle}>
            {project.category.name} — {project.title}
          </span>
        </Link>
      ) : null}
    </section>
  );
}
