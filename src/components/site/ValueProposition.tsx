import { Reveal } from "@/components/ui/Reveal";
import styles from "./ValueProposition.module.css";

// CONTEÚDO PROVISÓRIO: textos genéricos de posicionamento. Revisar com a Atlas antes da publicação.
const values = [
  {
    title: "Feito sob medida",
    text: "Cada projeto parte das medidas reais do espaço e do jeito como ele é usado no dia a dia.",
  },
  {
    title: "Acabamento em cada detalhe",
    text: "Encaixes, alinhamentos e ferragens recebem atenção especial, porque é nos detalhes que um móvel mostra que foi bem feito.",
  },
  {
    title: "Pensado para o seu ambiente",
    text: "Layout, materiais e cores escolhidos para combinar com o seu estilo e com a sua rotina.",
  },
];

export function ValueProposition() {
  return (
    <section className={styles.section} aria-labelledby="valor-title">
      <div className={`container ${styles.grid}`}>
        <Reveal>
          <p className={`eyebrow ${styles.eyebrow}`}>Nossa proposta</p>
          <h2 id="valor-title" className={`display ${styles.title}`}>
            Mais do que móveis: espaços que funcionam e que você gosta de estar.
          </h2>
        </Reveal>
        <ul className={styles.list}>
          {values.map((value, i) => (
            <li key={value.title}>
              <Reveal delay={i * 100} className={styles.item}>
                <span className={styles.num} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className={styles.itemTitle}>{value.title}</h3>
                  <p className={styles.text}>{value.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
