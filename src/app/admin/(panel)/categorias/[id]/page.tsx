import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryForAdmin } from "@/server/services/categories";
import { Icon } from "@/components/ui/Icon";
import { ActionForm, ActionSubmit } from "@/components/admin/ActionForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { pluralize } from "@/lib/format";
import { CategoryForm } from "../CategoryForm";
import { deleteCategoryAction, setCategoryActiveAction, updateCategoryAction } from "../actions";

export const metadata: Metadata = { title: "Editar categoria" };

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await getCategoryForAdmin(id);
  if (!category) notFound();
  const count = category._count.projects;

  return (
    <>
      <Link href="/admin/categorias" className="adm-back">
        <Icon name="arrowLeft" size={16} /> Categorias
      </Link>
      <div className="adm-page-head">
        <div>
          <h1>{category.name}</h1>
          <p className="adm-sub" style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px", alignItems: "center" }}>
            <StatusBadge status={category.isActive ? "published" : "hidden"} label={category.isActive ? "Visível no site" : "Oculta do site"} />
            <span>{pluralize(count, "projeto", "projetos")}</span>
          </p>
        </div>
        <div className="adm-actions">
          {category.isActive ? (
            <ActionForm
              action={setCategoryActiveAction}
              fields={{ id: category.id, active: "false" }}
              confirm={{
                title: `Ocultar “${category.name}” do site?`,
                message:
                  count > 0
                    ? `Os ${count} projeto(s) desta categoria deixarão de aparecer no site, mas continuam salvos aqui no painel.`
                    : "A categoria deixará de aparecer no site.",
                confirmLabel: "Sim, ocultar",
              }}
            >
              <ActionSubmit>
                <Icon name="eyeOff" size={18} /> Ocultar do site
              </ActionSubmit>
            </ActionForm>
          ) : (
            <ActionForm action={setCategoryActiveAction} fields={{ id: category.id, active: "true" }}>
              <ActionSubmit className="adm-btn adm-btn--primary">
                <Icon name="eye" size={18} /> Mostrar no site
              </ActionSubmit>
            </ActionForm>
          )}
        </div>
      </div>

      <section className="adm-card" aria-labelledby="dados">
        <div className="adm-card-head">
          <h2 id="dados">Dados da categoria</h2>
        </div>
        <CategoryForm
          action={updateCategoryAction.bind(null, category.id)}
          submitLabel="Salvar alterações"
          showCancel
          category={{ name: category.name, slug: category.slug, description: category.description }}
        />
      </section>

      <section className="adm-card" aria-labelledby="excluir">
        <div className="adm-card-head">
          <h2 id="excluir">Excluir categoria</h2>
        </div>
        {count > 0 ? (
          <p className="adm-help">
            Esta categoria tem {pluralize(count, "projeto", "projetos")} e por isso <strong>não pode ser excluída</strong>. Para tirá-la do site, use{" "}
            <strong>Ocultar do site</strong>: nada é perdido e você pode mostrá-la de novo quando quiser.
          </p>
        ) : (
          <>
            <p className="adm-help" style={{ marginBottom: 16 }}>
              Esta categoria não tem nenhum projeto. Se ela não será mais usada, você pode excluí-la de forma definitiva.
            </p>
            <ActionForm
              action={deleteCategoryAction}
              fields={{ id: category.id }}
              confirm={{
                title: `Excluir “${category.name}”?`,
                message: "A categoria será apagada de forma definitiva. Esta ação não pode ser desfeita.",
                confirmLabel: "Sim, excluir categoria",
                danger: true,
              }}
            >
              <ActionSubmit className="adm-btn adm-btn--danger">
                <Icon name="trash" size={18} /> Excluir categoria
              </ActionSubmit>
            </ActionForm>
          </>
        )}
      </section>
    </>
  );
}
