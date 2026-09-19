import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Picture } from "@/components/ui/Picture";
import { Reveal } from "@/components/ui/Reveal";
import { pluralize } from "@/lib/format";
import type { MediaImage } from "@/lib/media";
import styles from "./CategoryIndex.module.css";

type Item = { id: string; name: string; slug: string; description: string; count: number; cover: MediaImage | null };

/** Índice editorial de categorias. Totalmente alimentado pelo painel: nenhuma categoria fixa no código. */
export function CategoryIndex({ categories }: { categories: Item[] }) {
  if (categories.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="categorias-title">
      <div className="container">
        <Reveal className={styles.header}>
          <p className="eyebrow">Categorias</p>
          <h2 id="categorias-title" className={`display ${styles.title}`}>
            Explore por tipo de ambiente.
          </h2>
        </Reveal>

        <ul className={styles.list}>
          {categories.map((category, i) => (
            <li key={category.id}>
              <Reveal delay={i * 60}>
                <Link href={`/projetos?categoria=${category.slug}`} className={styles.row}>
                  <span className={styles.index} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.name}>{category.name}</span>
                  <span className={styles.count}>{pluralize(category.count, "projeto", "projetos")}</span>
                  <Icon name="arrowUpRight" size={26} className={styles.arrow} />
                  {category.cover ? (
                    <span className={styles.preview} aria-hidden="true">
                      <Picture image={category.cover} sizes="(min-width: 900px) 280px, 96px" ratio={1.3} alt="" />
                    </span>
                  ) : null}
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
