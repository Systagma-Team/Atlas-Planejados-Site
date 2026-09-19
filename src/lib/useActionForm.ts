"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { ActionResult } from "@/server/result";

/**
 * Envia um formulário para uma Server Action SEM limpar os campos quando há erro
 * (o comportamento padrão do React 19 com <form action> apagaria o que a pessoa digitou).
 */
export function useActionForm<T = undefined>(action: (formData: FormData) => Promise<ActionResult<T> | void>) {
  const [state, setState] = useState<ActionResult<T> | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await action(data);
        setState(result ?? null);
      } catch (error) {
        // redirect() feito pela ação é tratado pelo Next; o resto vira mensagem de erro.
        if (error && typeof error === "object" && "digest" in error && String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) {
          throw error;
        }
        setState({ ok: false, message: "Algo deu errado. Tente novamente em instantes." });
      }
    });
  };

  const fieldErrors: Record<string, string> = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  return { state, pending, onSubmit, fieldErrors };
}
