import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import type { ProjectCardData } from "@/server/queries/public";
import { ProjectCard } from "./ProjectCard";
import styles from "./FeaturedProjects.module.css";

type Cell = { span: number; ratio: number; sizes: string };

/**
 * Curadoria editorial: as linhas alternam larguras (7/5, 4/4/4, 6/6) e as proporções são calculadas
 * para que fotos da mesma linha tenham a mesma altura. Funciona com de 1 a 5 projetos em destaque.
 */
function layout(count: number): Cell[][] {
  const wide = (span: number, ratio: number): Cell => ({
    span,
    ratio,
    sizes: `(min-width: 1200px) ${Math.round((span / 12) * 1280)}px, (min-width: 900px) ${Math.round((span / 12) * 100)}vw, 100vw`,
  });
  switch (count) {
    case 1:
      return [[wide(12, 2.2)]];
    case 2:
      return [[wide(7, 1.4), wide(5, 1)]];
    case 3:
      return [[wide(4, 1), wide(4, 1), wide(4, 1)]];
    case 4:
      return [[wide(7, 1.4), wide(5, 1)], [wide(6, 1.2), wide(6, 1.2)]];
    default:
      return [[wide(7, 1.4), wide(5, 1)], [wide(4, 1), wide(4, 1), wide(4, 1)]];
  }
}

export function FeaturedProjects({ projects }: { projects: ProjectCardData[] }) {
  if (projects.length === 0) return null;
  const rows = layout(Math.min(projects.length, 5));
  let index = 0;

  return (
    <section className={styles.section} aria-labelledby="destaques-title">
      <div className="container--wide">
        <header className={styles.header}>
          <Reveal>
            <p className="eyebrow">Projetos selecionados</p>
            <h2 id="destaques-title" className={`display ${styles.title}`}>
              Ambientes que ganharam forma.
            </h2>
          </Reveal>
          <Reveal delay={100} className={styles.headerAction}>
            <Button href="/projetos" variant="secondary" icon="arrow">
              Ver todos os projetos
            </Button>
          </Reveal>
        </header>

        <div className={styles.rows}>
          {rows.map((row, r) => (
            <div key={r} className={styles.row}>
              {row.map((cell) => {
                const project = projects[index++];
                return (
                  <Reveal key={project.id} delay={(index % 3) * 90} className={styles.cell} style={{ ["--span" as string]: cell.span }}>
                    <ProjectCard project={project} ratio={cell.ratio} mobileRatio={1.15} sizes={cell.sizes} />
                  </Reveal>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
