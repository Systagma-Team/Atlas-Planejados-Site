import type { Metadata } from "next";
import Link from "next/link";
import { getActiveCategories, getPublishedProjects } from "@/server/queries/public";
import { PageHeader } from "@/components/site/PageHeader";
import { ProjectCard } from "@/components/site/ProjectCard";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import styles from "./projetos.module.css";

export const revalidate = 3600;

type Props = { searchParams: Promise<{ categoria?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { categoria } = await searchParams;
  const categories = await getActiveCategories();
  const current = categories.find((c) => c.slug === categoria);
  const title = current ? `Projetos de ${current.name}` : "Projetos";
  return {
    title,
    description: current
      ? `Veja projetos de ${current.name.toLowerCase()} realizados pela Atlas Planejados.`
      : "Portfólio da Atlas Planejados: projetos reais de móveis planejados sob medida.",
    // Filtros por categoria são variações da mesma listagem: a canônica é a página principal.
    alternates: { canonical: "/projetos" },
  };
}

export default async function ProjectsPage({ searchParams }: Props) {
  const { categoria } = await searchParams;
  const categories = await getActiveCategories();
  const current = categories.find((c) => c.slug === categoria);
  const projects = await getPublishedProjects(current?.slug);

  return (
    <>
      <PageHeader
        eyebrow="Portfólio"
        title={current ? current.name : "Projetos realizados"}
        lead={current?.description || "Uma seleção de projetos da Atlas Planejados. Cada um nasceu de um espaço, de uma medida e de uma necessidade diferente."}
      />

      <section className={styles.section} aria-label="Lista de projetos">
        <div className="container--wide">
          {categories.length > 0 ? (
            <nav className={styles.filters} aria-label="Filtrar por categoria">
              <Link href="/projetos" className={styles.pill} aria-current={!current ? "true" : undefined}>
                Todos
              </Link>
              {categories.map((c) => (
                <Link key={c.id} href={`/projetos?categoria=${c.slug}`} className={styles.pill} aria-current={current?.id === c.id ? "true" : undefined}>
                  {c.name}
                  <span className={styles.pillCount}>{c.count}</span>
                </Link>
              ))}
            </nav>
          ) : null}

          {projects.length > 0 ? (
            <ul className={styles.masonry}>
              {projects.map((project, i) => (
                <li key={project.id} className={styles.item}>
                  <Reveal delay={(i % 3) * 80}>
                    <ProjectCard
                      project={project}
                      headingLevel="h2"
                      priority={i < 2}
                      sizes="(min-width: 1200px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                  </Reveal>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>
              <h2 className={`display ${styles.emptyTitle}`}>Novos projetos em breve.</h2>
              <p>
                {current
                  ? "Ainda não há projetos publicados nesta categoria."
                  : "Estamos preparando o portfólio. Enquanto isso, fale com a gente e conte o que você precisa."}
              </p>
              <div className={styles.emptyActions}>
                {current ? (
                  <Button href="/projetos" variant="secondary">
                    Ver todos os projetos
                  </Button>
                ) : null}
                <Button href="/contato" icon="arrow">
                  Solicitar orçamento
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
