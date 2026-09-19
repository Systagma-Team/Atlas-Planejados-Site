"use client";

import Link from "next/link";
import { CheckField, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/admin/Fields";
import { useResultToast } from "@/components/admin/Toast";
import { useActionForm } from "@/lib/useActionForm";
import type { ActionResult } from "@/server/result";

type Props = {
  categories: { id: string; name: string; isActive: boolean }[];
  action: (formData: FormData) => Promise<ActionResult>;
  project?: {
    title: string;
    slug: string;
    categoryId: string;
    description: string;
    details: string;
    year: number | null;
    featured: boolean;
  };
  submitLabel: string;
};

export function ProjectForm({ categories, action, project, submitLabel }: Props) {
  const { state, pending, onSubmit, fieldErrors: errors } = useActionForm(action);
  useResultToast(state);

  return (
    <form onSubmit={onSubmit} className="adm-form" noValidate>
      {state && !state.ok && Object.keys(errors).length === 0 ? (
        <p className="adm-alert" role="alert">
          {state.message}
        </p>
      ) : null}

      <TextField label="Título do projeto" name="title" defaultValue={project?.title} error={errors.title} required maxLength={120} placeholder="Ex.: Cozinha em U com armários cinza" />

      <div className="adm-row adm-row--2">
        <SelectField label="Categoria" name="categoryId" defaultValue={project?.categoryId ?? ""} error={errors.categoryId} required>
          <option value="" disabled>
            Escolha uma categoria
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.isActive ? "" : " (oculta do site)"}
            </option>
          ))}
        </SelectField>
        <TextField label={<>Ano <small>(opcional)</small></>} name="year" type="number" inputMode="numeric" min={1980} max={new Date().getFullYear() + 1} defaultValue={project?.year ?? ""} error={errors.year} placeholder="Ex.: 2025" />
      </div>

      <TextAreaField
        label="Resumo"
        name="description"
        defaultValue={project?.description}
        error={errors.description}
        rows={3}
        maxLength={400}
        help="Uma ou duas frases. Aparece na página do projeto e nos resultados de busca."
      />

      <TextAreaField
        label={<>Texto complementar <small>(opcional)</small></>}
        name="details"
        defaultValue={project?.details}
        error={errors.details}
        rows={6}
        help="Conte mais sobre o projeto: materiais, desafios, solução. Deixe uma linha em branco entre os parágrafos."
      />

      <CheckField
        name="featured"
        title="Mostrar em destaque na página inicial"
        description="Os projetos em destaque compõem a seleção da página inicial. O mais recente aparece como foto principal."
        defaultChecked={project?.featured}
      />

      <details>
        <summary style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center", fontWeight: 600 }}>Endereço da página (avançado)</summary>
        <div style={{ marginTop: 8 }}>
          <TextField
            label="Endereço"
            name="slug"
            defaultValue={project?.slug}
            error={errors.slug}
            maxLength={100}
            placeholder="gerado-automaticamente"
            help={project ? "Mudar este endereço quebra links já compartilhados. Só altere se for necessário." : "Deixe em branco para gerar automaticamente a partir do título."}
          />
        </div>
      </details>

      <div className="adm-form-actions">
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
        <Link href="/admin/projetos" className="adm-btn">
          Voltar à lista
        </Link>
      </div>
    </form>
  );
}
