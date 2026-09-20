import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllProjectSlugs, getPublishedProjectBySlug, getRelatedProjects } from "@/lib/content";
import { ProjectGallery } from "@/components/site/ProjectGallery";
import { ProjectCard } from "@/components/site/ProjectCard";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { paragraphs } from "@/lib/format";
import { mediaUrl, variantWidths } from "@/lib/media";
import { SITE_NAME, whatsappOptions } from "@/lib/site";
import { getSettings } from "@/lib/content";
import styles from "./projeto.module.css";

// Uma página estática por projeto publicado (o endereço é o nome da pasta em conteudo/projetos/).
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllProjectSlugs().map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (!project) return { title: "Projeto não encontrado", robots: { index: false } };

  const description =
    project.description || `${project.title} — projeto de ${project.category.name.toLowerCase()} da ${SITE_NAME}.`;
  const shareWidth = variantWidths(project.cover.width).find((w) => w >= 1200) ?? variantWidths(project.cover.width).at(-1)!;

  return {
    title: project.title,
    description,
    alternates: { canonical: `/projetos/${project.slug}` },
    openGraph: {
      type: "article",
      title: project.title,
      description,
      url: `/projetos/${project.slug}`,
      images: [
        {
          url: mediaUrl(project.cover.fileKey, shareWidth),
          width: Math.min(project.cover.width, shareWidth),
          height: Math.round((project.cover.height * Math.min(project.cover.width, shareWidth)) / project.cover.width),
          alt: project.cover.alt,
        },
      ],
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (!project) notFound();

  const [related, settings] = await Promise.all([getRelatedProjects(project.id, project.category.id, 3), getSettings()]);
  // Botão de orçamento: abre o WhatsApp principal já citando o projeto. Sem WhatsApp cadastrado, cai na página de contato.
  const quote = whatsappOptions(settings, `Olá! Tenho interesse em um projeto como “${project.title}”.`)[0];
  const details = paragraphs(project.details);
  const hasOriginals = project.images.some((i) => i.original);

  return (
    <article>
      <header className={styles.header}>
        <div className="container">
          <nav aria-label="Você está em" className={styles.breadcrumb}>
            <Link href="/projetos" className={styles.back}>
              <Icon name="arrowLeft" size={16} /> Projetos
            </Link>
            <span aria-hidden="true">/</span>
            <Link href={`/projetos/categoria/${project.category.slug}`}>{project.category.name}</Link>
          </nav>

          <div className={styles.headGrid}>
            <div>
              <p className="eyebrow">{project.category.name}</p>
              <h1 className={`display ${styles.title}`}>{project.title}</h1>
            </div>
            <div className={styles.intro}>
              {project.description ? <p className={styles.lead}>{project.description}</p> : null}
              <dl className={styles.facts}>
                <div>
                  <dt>Categoria</dt>
                  <dd>{project.category.name}</dd>
                </div>
                {project.year ? (
                  <div>
                    <dt>Ano</dt>
                    <dd>{project.year}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Fotos</dt>
                  <dd>{project.images.length}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.gallery} aria-label="Fotos do projeto">
        <div className="container">
          {hasOriginals ? (
            <p className={styles.note} role="note">
              <Icon name="image" size={18} />
              <span>
                As imagens deste projeto foram tratadas digitalmente. Para conferir a peça como ela é, use <strong>“Ver foto original”</strong> em cada imagem.
              </span>
            </p>
          ) : null}
          <ProjectGallery images={project.images} title={project.title} />
        </div>
      </section>

      {details.length > 0 ? (
        <section className={styles.details} aria-labelledby="sobre-projeto">
          <div className={`container ${styles.detailsGrid}`}>
            <h2 id="sobre-projeto" className="eyebrow">
              Sobre o projeto
            </h2>
            <div className={styles.prose}>
              {details.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.cta} aria-labelledby="quero-title">
        <div className={`container ${styles.ctaGrid}`}>
          <h2 id="quero-title" className={`display ${styles.ctaTitle}`}>
            Quer um projeto assim para o seu espaço?
          </h2>
          {quote ? (
            <Button href={quote.href} external icon="whatsapp">
              Pedir orçamento no WhatsApp
            </Button>
          ) : (
            <Button href={"/contato"} icon="arrow">
              Solicitar orçamento
            </Button>
          )}
        </div>
      </section>

      {related.length > 0 ? (
        <section className={styles.related} aria-labelledby="ver-tambem">
          <div className="container">
            <h2 id="ver-tambem" className={`display ${styles.relatedTitle}`}>
              Ver também
            </h2>
            <ul className={styles.relatedGrid}>
              {related.map((p, i) => (
                <li key={p.id}>
                  <Reveal delay={i * 80}>
                    <ProjectCard project={p} ratio={1.25} sizes="(min-width: 900px) 400px, 100vw" />
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </article>
  );
}
