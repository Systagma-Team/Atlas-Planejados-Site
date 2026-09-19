"use client";

import { createContext, useContext, useRef, useState, useTransition, type ReactNode } from "react";
import type { ActionResult } from "@/server/result";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "./Toast";

const PendingContext = createContext(false);

type Props = {
  action: (formData: FormData) => Promise<ActionResult<unknown> | void>;
  /** Valores enviados junto com a ação (ex.: { id }). */
  fields?: Record<string, string>;
  /** Quando informado, pede confirmação antes de executar. */
  confirm?: { title: string; message: string; confirmLabel: string; danger?: boolean };
  className?: string;
  children: ReactNode;
};

/**
 * Formulário de uma ação simples (publicar, ocultar, excluir…): executa a Server Action,
 * mostra o resultado como aviso e, se configurado, pede confirmação antes.
 */
export function ActionForm({ action, fields, confirm, className, children }: Props) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const run = () => {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    startTransition(async () => {
      try {
        const result = await action(data);
        if (result?.message) toast(result.message, result.ok ? "success" : "error");
      } catch (error) {
        // redirect() dentro da ação é tratado pelo Next; qualquer outro erro vira aviso.
        if (error && typeof error === "object" && "digest" in error && String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw error;
        toast("Algo deu errado. Tente novamente.", "error");
      }
      setOpen(false);
    });
  };

  return (
    <PendingContext.Provider value={pending}>
      <form
        ref={formRef}
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          if (confirm) setOpen(true);
          else run();
        }}
      >
        {Object.entries(fields ?? {}).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        {children}
      </form>
      {confirm ? <ConfirmDialog open={open} pending={pending} onClose={() => setOpen(false)} onConfirm={run} {...confirm} /> : null}
    </PendingContext.Provider>
  );
}

/** Botão de envio que fica desabilitado enquanto a ação roda. Use dentro de <ActionForm>. */
export function ActionSubmit({ children, className = "adm-btn" }: { children: ReactNode; className?: string }) {
  const pending = useContext(PendingContext);
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {children}
    </button>
  );
}
