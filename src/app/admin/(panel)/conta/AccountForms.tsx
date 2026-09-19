"use client";

import { useEffect, useRef } from "react";
import { SubmitButton, TextField } from "@/components/admin/Fields";
import { useResultToast } from "@/components/admin/Toast";
import { useActionForm } from "@/lib/useActionForm";
import type { ActionResult } from "@/server/result";

export function ProfileForm({ name, email, action }: { name: string; email: string; action: (fd: FormData) => Promise<ActionResult> }) {
  const { state, pending, onSubmit, fieldErrors: e } = useActionForm(action);
  useResultToast(state);
  return (
    <form onSubmit={onSubmit} className="adm-form" noValidate>
      <div className="adm-row adm-row--2">
        <TextField label="Nome" name="name" defaultValue={name} error={e.name} required autoComplete="name" />
        <TextField label="E-mail de acesso" name="email" type="email" defaultValue={email} error={e.email} required autoComplete="username" />
      </div>
      <div className="adm-form-actions">
        <SubmitButton pending={pending}>Salvar dados</SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm({ action }: { action: (fd: FormData) => Promise<ActionResult> }) {
  const { state, pending, onSubmit, fieldErrors: e } = useActionForm(action);
  const formRef = useRef<HTMLFormElement>(null);
  useResultToast(state);

  // Depois de trocar a senha com sucesso, limpa os campos.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="adm-form" noValidate>
      <TextField label="Senha atual" name="current" type="password" autoComplete="current-password" error={e.current} required />
      <div className="adm-row adm-row--2">
        <TextField label="Nova senha" name="next" type="password" autoComplete="new-password" error={e.next} required help="Pelo menos 8 caracteres." />
        <TextField label="Repita a nova senha" name="confirm" type="password" autoComplete="new-password" error={e.confirm} required />
      </div>
      <div className="adm-form-actions">
        <SubmitButton pending={pending}>Alterar senha</SubmitButton>
      </div>
    </form>
  );
}
