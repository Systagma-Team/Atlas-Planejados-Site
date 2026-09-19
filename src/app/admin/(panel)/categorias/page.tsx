import type { Metadata } from "next";
import Link from "next/link";
import { listCategoriesForAdmin } from "@/server/services/categories";
import { Icon } from "@/components/ui/Icon";
import { ActionForm, ActionSubmit } from "@/components/admin/ActionForm";
import { FlashToast } from "@/components/admin/Toast";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { pluralize } from "@/lib/format";
import { CategoryForm } from "./CategoryForm";
import { createCategoryAction, moveCategoryAction, setCategoryActiveAction } from "./actions";

export const metadata: Metadata = { title: "Categorias" };

type Props = { searchParams: Promise<{ criada?: string; excluida?: string }> };

export default async function CategoriesPage({ searchParams }: Props) {
  const { criada, excluida } = await searchParams;
  const categories = await listCategoriesForAdmin();
  const flash = criada ? "Categoria criada." : excluida ? "Categoria excluída." : undefined;

  return (
    <>
      <FlashToast message={flash} param={criada ? "criada" : "excluida"} />

      <div className="adm-page-head">
        <div>
          <h1>Categorias</h1>
          <p className="adm-sub">
            As categorias organizam os projetos no site. Para tirar uma categoria do site sem perder nada, use <strong>Ocultar</strong> — os projetos continuam salvos.
          </p>
        </div>
      </div>

      <section className="adm-card" aria-labelledby="lista">
        <div className="adm-card-head">
          <h2 id="lista">Categorias cadastradas</h2>
          <p className="adm-help">A ordem aqui é a mesma do site.</p>
        </div>

        {categories.length === 0 ? (
          <div className="adm-empty">
            <h2>Nenhuma categoria ainda</h2>
            <p>Crie a primeira categoria abaixo (por exemplo, Cozinhas).</p>
          </div>
        ) : (
          <ul className="adm-list" style={{ border: 0, borderRadius: 0 }} aria-label="Categorias">
            {categories.map((c, index) => (
              <li key={c.id} className="adm-item" style={{ paddingInline: 0, gridTemplateColumns: "1fr" }}>
                <div style={{ display: "grid", gap: 12 }} className="adm-cat-row">
                  <div className="adm-item-main">
                    <Link href={`/admin/categorias/${c.id}`} className="adm-item-title">
                      {c.name}
                    </Link>
                    <div className="adm-meta">
                      <span>{pluralize(c.projectCount, "projeto", "projetos")}</span>
                      <span>{c.publishedCount} publicado(s)</span>
                      <span>/projetos?categoria={c.slug}</span>
                    </div>
                  </div>
                  <div className="adm-item-side" style={{ justifyContent: "flex-start" }}>
                    <StatusBadge status={c.isActive ? "published" : "hidden"} label={c.isActive ? "Visível no site" : "Oculta do site"} />

                    <ActionForm action={moveCategoryAction} fields={{ id: c.id, direction: "up" }}>
                      <ActionSubmit className="adm-icon-btn">
                        <span className="visually-hidden">Subir {c.name}</span>
                        <Icon name="up" size={18} />
                      </ActionSubmit>
                    </ActionForm>
                    <ActionForm action={moveCategoryAction} fields={{ id: c.id, direction: "down" }}>
                      <ActionSubmit className="adm-icon-btn">
                        <span className="visually-hidden">Descer {c.name}</span>
                        <Icon name="down" size={18} />
                      </ActionSubmit>
                    </ActionForm>

                    {c.isActive ? (
                      <ActionForm
                        action={setCategoryActiveAction}
                        fields={{ id: c.id, active: "false" }}
                        confirm={{
                          title: `Ocultar “${c.name}” do site?`,
                          message:
                            c.projectCount > 0
                              ? `Os ${c.projectCount} projeto(s) desta categoria deixarão de aparecer no site, mas continuam salvos aqui no painel. Você pode mostrar a categoria de novo quando quiser.`
                              : "A categoria deixará de aparecer no site. Você pode mostrá-la de novo quando quiser.",
                          confirmLabel: "Sim, ocultar",
                        }}
                      >
                        <ActionSubmit className="adm-btn adm-btn--sm">
                          <Icon name="eyeOff" size={16} /> Ocultar
                        </ActionSubmit>
                      </ActionForm>
                    ) : (
                      <ActionForm action={setCategoryActiveAction} fields={{ id: c.id, active: "true" }}>
                        <ActionSubmit className="adm-btn adm-btn--sm">
                          <Icon name="eye" size={16} /> Mostrar no site
                        </ActionSubmit>
                      </ActionForm>
                    )}

                    <Link href={`/admin/categorias/${c.id}`} className="adm-btn adm-btn--sm">
                      Editar
                    </Link>
                  </div>
                </div>
                <span className="visually-hidden">Posição {index + 1} de {categories.length}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="adm-card" aria-labelledby="nova">
        <div className="adm-card-head">
          <h2 id="nova">Nova categoria</h2>
        </div>
        <CategoryForm action={createCategoryAction} submitLabel="Criar categoria" />
      </section>
    </>
  );
}
