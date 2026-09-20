"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { WhatsappOption } from "@/lib/site";
import styles from "./WhatsAppFloat.module.css";

/**
 * Botão flutuante de WhatsApp, presente em todas as páginas públicas.
 * Com um número: abre a conversa direto. Com dois: abre uma pequena lista para a pessoa escolher (principal ou secundário).
 */
export function WhatsAppFloat({ options }: { options: WhatsappOption[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Fecha ao clicar fora ou apertar Esc (devolvendo o foco ao botão).
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (options.length === 0) return null;

  if (options.length === 1) {
    return (
      <aside className={styles.root} aria-label="Contato rápido por WhatsApp">
        <a className={styles.fab} href={options[0].href} target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp (abre em nova aba)">
          <Icon name="whatsapp" size={28} />
        </a>
      </aside>
    );
  }

  return (
    <aside className={styles.root} ref={rootRef} aria-label="Contato rápido por WhatsApp">
      {open ? (
        <div id={menuId} className={styles.menu} role="group" aria-label="Escolha um número de WhatsApp">
          <p className={styles.menuTitle}>Falar no WhatsApp</p>
          {options.map((o) => (
            <a key={o.key} className={styles.option} href={o.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              <Icon name="whatsapp" size={20} />
              <span>
                <strong>{o.label}</strong>
                <span className={styles.number}>{o.number}</span>
              </span>
            </a>
          ))}
        </div>
      ) : null}

      <button
        ref={toggleRef}
        type="button"
        className={styles.fab}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={open ? "Fechar opções de WhatsApp" : "Falar no WhatsApp: escolher número"}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name={open ? "close" : "whatsapp"} size={28} />
      </button>
    </aside>
  );
}
