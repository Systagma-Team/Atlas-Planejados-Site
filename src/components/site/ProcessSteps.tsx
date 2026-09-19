import { Reveal } from "@/components/ui/Reveal";
import styles from "./ProcessSteps.module.css";

// CONTEÚDO PROVISÓRIO: etapas típicas de um projeto de móvel planejado.
// Ajustar para refletir exatamente o processo de trabalho da Atlas.
const steps = [
  { title: "Conversa inicial", text: "Entendemos o que você precisa, como usa o ambiente e o que espera do resultado." },
  { title: "Medição", text: "Levantamos as medidas e observamos o espaço no local." },
  { title: "Projeto", text: "Desenvolvemos a proposta com layout, acabamentos e detalhes para a sua aprovação." },
  { title: "Produção", text: "O projeto aprovado é fabricado com cuidado e conferência das peças." },
  { title: "Instalação", text: "Montagem no local e entrega do ambiente pronto para uso." },
];

export function ProcessSteps({ headingLevel: H = "h2" }: { headingLevel?: "h2" | "h3" }) {
  return (
    <section className={styles.section} aria-labelledby="processo-title">
      <div className="container">
        <Reveal className={styles.header}>
          <p className="eyebrow">Como trabalhamos</p>
          <H id="processo-title" className={`display ${styles.title}`}>
            Do primeiro contato ao móvel instalado.
          </H>
        </Reveal>
        <ol className={styles.steps}>
          {steps.map((step, i) => (
            <li key={step.title} className={styles.step}>
              <Reveal delay={i * 80}>
                <span className={styles.num} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.text}>{step.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
