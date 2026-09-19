import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import styles from "./Differentials.module.css";

// CONTEÚDO PROVISÓRIO: diferenciais genéricos, sem números ou promessas específicas.
// Substituir pelos diferenciais reais da Atlas quando forem definidos.
const items = [
  "Projeto desenvolvido para as medidas do seu espaço",
  "Acabamentos escolhidos junto com você",
  "Atenção às ferragens, encaixes e alinhamentos",
  "Acompanhamento do briefing à instalação",
];

export function Differentials() {
  return (
    <section className={styles.section} aria-labelledby="diferenciais-title">
      <div className={`container ${styles.grid}`}>
        <Reveal>
          <p className="eyebrow">Diferenciais</p>
          <h2 id="diferenciais-title" className={`display ${styles.title}`}>
            O que você pode esperar do nosso trabalho.
          </h2>
        </Reveal>
        <ul className={styles.list}>
          {items.map((item, i) => (
            <li key={item}>
              <Reveal delay={i * 70} className={styles.item}>
                <Icon name="check" size={22} className={styles.check} />
                <span>{item}</span>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
