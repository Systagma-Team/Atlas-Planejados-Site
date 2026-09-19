import type { ZodError } from "zod";

// Formato padrão de retorno das ações do painel: sempre mensagens em português simples.
export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export const fail = (message: string, fieldErrors?: Record<string, string>): ActionResult<never> => ({
  ok: false,
  message,
  fieldErrors,
});

export const success = <T = undefined>(message?: string, data?: T): ActionResult<T> => ({ ok: true, message, data });

export function zodFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
