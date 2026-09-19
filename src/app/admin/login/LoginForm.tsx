"use client";

import { SubmitButton, TextField } from "@/components/admin/Fields";
import { useActionForm } from "@/lib/useActionForm";
import { loginAction } from "./actions";

export function LoginForm() {
  const { state, pending, onSubmit } = useActionForm((fd) => loginAction(null, fd));

  return (
    <form onSubmit={onSubmit} className="adm-form" noValidate>
      {state && !state.ok ? (
        <p className="adm-alert" role="alert">
          {state.message}
        </p>
      ) : null}
      <TextField label="E-mail" name="email" type="email" autoComplete="username" required autoFocus />
      <TextField label="Senha" name="password" type="password" autoComplete="current-password" required />
      <SubmitButton pending={pending} pendingLabel="Entrando…">
        Entrar
      </SubmitButton>
    </form>
  );
}
