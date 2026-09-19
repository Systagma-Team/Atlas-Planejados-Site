import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { Icon } from "@/components/ui/Icon";
import { ActionForm, ActionSubmit } from "@/components/admin/ActionForm";
import { FlashToast } from "@/components/admin/Toast";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate, pluralize, projectStatus } from "@/lib/format";
import { mediaThumb } from "@/lib/media";
import { setFeaturedAction, setPublishedAction } from "./actions";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = { title: "Projetos" };

type Props = { searchParams: Promise<{ q?: string; situacao?: string; categoria?: string; excluido?: string }> };

export default async function ProjectsAdminPage({ searchParams }: Props) {
  const { q, situacao, categoria, excluido } = await searchParams;

  const where: Prisma.ProjectWhereInput = {};
  if (q?.trim()) where.title = { contains: q.trim(), mode: "insensitive" };
  if (categoria) where.categoryId = categoria;
  if (situacao === "publicado") Object.assign(where, { published: true, category: { isActive: true } });
  if (situacao === "rascunho") where.published = false;
  if (situacao === "oculto") Object.assign(where, { published: true, category: { isActive: false } });

  const [projects, categories, totalAll] = await Promise.all([
    db.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { category: true, coverImage: true, images: { orderBy: { displayOrder: "asc" }, take: 1 }, _count: { select: { images: true } } },
    }),
    db.category.findMany({ orderBy: [{ displayOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    db.project.count(),
  ]);

  const filtered = !!(q?.trim() || situacao || categoria);

  return (
    <>
      <FlashToast message={excluido ? "Projeto excluído." : undefined} param="excluido" />

      <div className="adm-page-head">
        <div>
          <h1>Projetos</h1>
          <p className="adm-sub">Todos os projetos cadastrados, publicados ou não.</p>
        </div>
        <Link href="/admin/projetos/novo" className="adm-btn adm-btn--primary">
          <Icon name="plus" size={18} /> Novo projeto
        </Link>
      </div>

      {totalAll > 0 ? (
        <form className="adm-filters" method="get" role="search" aria-label="Filtrar projetos">
          <div className="adm-field">
            <label className="adm-label" htmlFor="q">Buscar</label>
            <input id="q" name="q" className="adm-input" defaultValue={q} placeholder="Nome do projeto" />
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor="situacao">Situação</label>
            <select id="situacao" name="situacao" className="adm-select" defaultValue={situacao ?? ""}>
              <option value="">Todas</option>
              <option value="publicado">Publicado</option>
              <option value="rascunho">Rascunho</option>
              <option value="oculto">Oculto (categoria oculta)</option>
            </select>
          </div>
          <div className="adm-field">
            <label className="adm-label" htmlFor="categoria">Categoria</label>
            <select id="categoria" name="categoria" className="adm-select" defaultValue={categoria ?? ""}>
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="adm-actions">
            <button type="submit" className="adm-btn">Filtrar</button>
            {filtered ? <Link href="/admin/projetos" className="adm-btn adm-btn--sm">Limpar</Link> : null}
          </div>
        </form>
      ) : null}

      {projects.length === 0 ? (
        <div className="adm-card">
          <div className="adm-empty">
            <h2>{filtered ? "Nenhum projeto encontrado" : "Nenhum projeto cadastrado ainda"}</h2>
            <p>{filtered ? "Tente mudar ou limpar os filtros." : "Cadastre o primeiro projeto para que ele possa aparecer no site."}</p>
            {!filtered ? (
              <Link href="/admin/projetos/novo" className="adm-btn adm-btn--primary">Cadastrar projeto</Link>
            ) : null}
          </div>
        </div>
      ) : (
        <ul className="adm-list" aria-label="Lista de projetos">
          {projects.map((p) => {
            const cover = p.coverImage ?? p.images[0];
            const status = projectStatus(p);
            return (
              <li key={p.id} className="adm-item">
                <div className={`adm-thumb ${cover ? "" : "adm-thumb--empty"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {cover ? <img src={mediaThumb(cover)} alt="" loading="lazy" /> : <Icon name="image" size={24} />}
                </div>
                <div className="adm-item-main">
                  <Link href={`/admin/projetos/${p.id}`} className="adm-item-title">{p.title}</Link>
                  <div className="adm-meta">
                    <span>{p.category.name}{p.category.isActive ? "" : " (oculta)"}</span>
                    <span>{pluralize(p._count.images, "foto", "fotos")}</span>
                    <span>Atualizado em {formatDate(p.updatedAt)}</span>
                    {p.featured ? (
                      <span className="adm-star"><Icon name="star" size={14} /> Em destaque</span>
                    ) : null}
                  </div>
                </div>
                <div className="adm-item-side">
                  <StatusBadge status={status} />
                </div>
                <div className="adm-item-side">
                  {p.published ? (
                    <ActionForm action={setPublishedAction} fields={{ id: p.id, published: "false" }}>
                      <ActionSubmit className="adm-btn adm-btn--sm">Despublicar</ActionSubmit>
                    </ActionForm>
                  ) : (
                    <ActionForm action={setPublishedAction} fields={{ id: p.id, published: "true" }}>
                      <ActionSubmit className="adm-btn adm-btn--sm">Publicar</ActionSubmit>
                    </ActionForm>
                  )}
                  <ActionForm action={setFeaturedAction} fields={{ id: p.id, featured: String(!p.featured) }}>
                    <ActionSubmit className="adm-btn adm-btn--sm">{p.featured ? "Tirar do destaque" : "Destacar"}</ActionSubmit>
                  </ActionForm>
                  <Link href={`/admin/projetos/${p.id}`} className="adm-btn adm-btn--sm">Editar</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
