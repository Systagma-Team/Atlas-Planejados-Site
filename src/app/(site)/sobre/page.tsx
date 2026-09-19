import type { Metadata } from "next";
import { getFeaturedProjects } from "@/server/queries/public";
import { getSettings } from "@/server/services/settings";
import { paragraphs } from "@/lib/format";
import { PageHeader } from "@/components/site/PageHeader";
import { ProcessSteps } from "@/components/site/ProcessSteps";
import { ContactCta } from "@/components/site/ContactCta";
import { Picture } from "@/components/ui/Picture";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import styles from "./sobre.module.css";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sobre a Atlas Planejados",
  description: "Conheça a Atlas Planejados: nosso propósito, a forma como trabalhamos e o compromisso com a qualidade de cada projeto.",
  alternates: { canonical: "/sobre" },
};

// CONTEÚDO PROVISÓRIO: princípios genéricos de posicionamento. Revisar com a Atlas.
const principles = [
  {
    title: "Propósito",
    text: "Transformar espaços em ambientes funcionais e bonitos, com móveis pensados a partir da necessidade real de cada cliente.",
  },
  {
    title: "Filosofia de trabalho",
    text: "Escutar antes de desenhar. Cada projeto é único: medidas, rotina e estilo definem as soluções, não o contrário.",
  },
  {
    title: "Compromisso com a qualidade",
    text: "Atenção às ferragens, aos encaixes e ao acabamento. O detalhe bem resolvido é o que faz um móvel durar e agradar.",
  },
];

export default async function AboutPage() {
  const [settings, featured] = await Promise.all([getSettings(), getFeaturedProjects(3)]);
  const story = paragraphs(settings.aboutText);

  return (
    <>
      <PageHeader
        eyebrow="Sobre"
        title="Móveis planejados feitos com atenção ao detalhe."
        lead="A Atlas Planejados projeta e produz móveis sob medida para transformar a forma como você vive e trabalha nos seus espaços."
      />

      <section className={styles.section} aria-labelledby="trajetoria">
        <div className={`container ${styles.storyGrid}`}>
          <h2 id="trajetoria" className="eyebrow">
            Nossa trajetória
          </h2>
          <Reveal className={styles.story}>
            {story.length > 0 ? (
              story.map((p, i) => <p key={i}>{p}</p>)
            ) : (
              // Conteúdo provisório — some sozinho quando o texto "Sobre" for preenchido no painel.
              <div className={styles.placeholder}>
                <span className={styles.placeholderTag}>Conteúdo provisório</span>
                <p>
                  Aqui entra a história da Atlas: como começou, a experiência da equipe e o que a move. Este texto será substituído pelas
                  informações reais da empresa.
                </p>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      <section className={styles.section} aria-label="Princípios">
        <div className="container">
          <ul className={styles.principles}>
            {principles.map((p, i) => (
              <li key={p.title}>
                <Reveal delay={i * 90} className={styles.principle}>
                  <span className={styles.num} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className={styles.principleTitle}>{p.title}</h3>
                  <p>{p.text}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {featured.length > 0 ? (
        <section className={styles.mosaicSection} aria-label="Projetos da Atlas">
          <div className="container--wide">
            <ul className={styles.mosaic}>
              {featured.map((project, i) => (
                <li key={project.id} className={styles.mosaicItem} data-i={i}>
                  <Reveal delay={i * 100}>
                    <Picture
                      image={project.cover}
                      ratio={i === 0 ? 1.15 : 0.9}
                      mobileRatio={1.2}
                      sizes="(min-width: 900px) 40vw, 100vw"
                    />
                  </Reveal>
                </li>
              ))}
            </ul>
            <div className={styles.mosaicAction}>
              <Button href="/projetos" variant="secondary" icon="arrow">
                Ver os projetos
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <ProcessSteps />
      <ContactCta settings={settings} />
    </>
  );
}
