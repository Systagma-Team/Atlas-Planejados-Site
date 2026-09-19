"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import styles from "./Reveal.module.css";

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Atraso em ms, para escalonar itens de uma mesma lista. */
  delay?: number;
  style?: CSSProperties;
};

/** Faz o conteúdo surgir suavemente ao entrar na tela. Sem JS ou com "reduzir movimento", aparece direto. */
export function Reveal({ children, as: Tag = "div", className, delay = 0, style }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.dataset.visible = "true";
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.visible = "true";
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={[styles.reveal, className].filter(Boolean).join(" ")} style={delay ? { ...style, transitionDelay: `${delay}ms` } : style}>
      {children}
    </Tag>
  );
}
