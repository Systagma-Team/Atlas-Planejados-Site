"use client";

import Link from "next/link";
import { SubmitButton, TextAreaField, TextField } from "@/components/admin/Fields";
import { useResultToast } from "@/components/admin/Toast";
import { useActionForm } from "@/lib/useActionForm";
import type { ActionResult } from "@/server/result";

type Props = {
  action: (formData: FormData) => Promise<ActionResult>;
  category?: { name: string; slug: string; description: string };
  submitLabel: string;
  showCancel?: boolean;
};

export function CategoryForm({ action, category, submitLabel, showCancel }: Props) {
  const { state, pending, onSubmit, fieldErrors: errors } = useActionForm(action);
  useResultToast(state);

  return (
    <form onSubmit={onSubmit} className="adm-form" noValidate>
      {state && !state.ok && Object.keys(errors).length === 0 ? (
        <p className="adm-alert" role="alert">
          {state.message}
        </p>
      ) : null}

      <TextField label="Nome da categoria" name="name" defaultValue={category?.name} error={errors.name} required maxLength={60} placeholder="Ex.: Cozinhas" />
      <TextAreaField
        label={<>Descrição <small>(opcional)</small></>}
        name="description"
        defaultValue={category?.description}
        error={errors.description}
        rows={2}
        maxLength={300}
        help="Uma frase curta que aparece no topo da página da categoria."
      />
      <details open={!!errors.slug}>
        <summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center", fontWeight: 600 }}>Endereço da página (avançado)</summary>
        <div style={{ marginTop: 8 }}>
          <TextField
            label="Endereço"
            name="slug"
            defaultValue={category?.slug}
            error={errors.slug}
            maxLength={80}
            placeholder="gerado-automaticamente"
            help={category ? "Mudar este endereço quebra links já compartilhados. Só altere se for necessário." : "Deixe em branco para gerar automaticamente a partir do nome."}
          />
        </div>
      </details>

      <div className="adm-form-actions">
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
        {showCancel ? (
          <Link href="/admin/categorias" className="adm-btn">
            Voltar à lista
          </Link>
        ) : null}
      </div>
    </form>
  );
}
