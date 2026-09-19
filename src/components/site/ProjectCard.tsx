import Link from "next/link";
import { Picture } from "@/components/ui/Picture";
import { Icon } from "@/components/ui/Icon";
import type { ProjectCardData } from "@/server/queries/public";
import styles from "./ProjectCard.module.css";

type Props = {
  project: ProjectCardData;
  sizes: string;
  /** Proporção do recorte. Omitida: mostra a foto inteira (portfólio). */
  ratio?: number;
  mobileRatio?: number;
  priority?: boolean;
  headingLevel?: "h2" | "h3";
};

/** Card editorial: foto grande, legenda discreta. O card inteiro é um único link. */
export function ProjectCard({ project, sizes, ratio, mobileRatio, priority, headingLevel: H = "h3" }: Props) {
  return (
    <article className={styles.card}>
      <div className={styles.media}>
        <Picture image={project.cover} sizes={sizes} ratio={ratio} mobileRatio={mobileRatio} priority={priority} className={styles.picture} />
        <span className={styles.badge} aria-hidden="true">
          Ver projeto <Icon name="arrowUpRight" size={16} />
        </span>
      </div>
      <div className={styles.meta}>
        <p className={styles.category}>{project.category.name}</p>
        <H className={styles.title}>
          <Link href={`/projetos/${project.slug}`} className={styles.link}>
            {project.title}
          </Link>
        </H>
      </div>
    </article>
  );
}
