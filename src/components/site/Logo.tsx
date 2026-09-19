import styles from "./Logo.module.css";

/** Marca tipográfica provisória da Atlas. Substituir por arte-final do logotipo quando disponível. */
export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={[styles.logo, inverse ? styles.inverse : ""].join(" ")}>
      <span className={styles.name}>Atlas</span>
      <span className={styles.tag}>Planejados</span>
    </span>
  );
}
