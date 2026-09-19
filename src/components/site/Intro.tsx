import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./Intro.module.css";

/** Apresentação curta da Atlas. Texto de posicionamento — sem números ou fatos da empresa. */
export function Intro() {
  return (
    <section className={styles.section} aria-labelledby="intro-title">
      <div className={`container ${styles.grid}`}>
        <Reveal>
          <p className="eyebrow">A Atlas</p>
        </Reveal>
        <Reveal delay={80} className={styles.body}>
          <h2 id="intro-title" className={`display ${styles.statement}`}>
            Cada ambiente pede um projeto próprio. A Atlas desenha, fabrica e instala móveis planejados sob medida.
          </h2>
          <div className={styles.side}>
            <p>
              Do primeiro desenho à instalação, o cuidado está na medida certa, no encaixe preciso e no acabamento que você percebe ao tocar
              cada detalhe.
            </p>
            <Button href="/sobre" variant="secondary" icon="arrow">
              Conheça a Atlas
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
