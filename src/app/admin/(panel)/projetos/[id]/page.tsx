import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { getProjectForAdmin } from "@/server/services/projects";
import { Icon } from "@/components/ui/Icon";
import { ActionForm, ActionSubmit } from "@/components/admin/ActionForm";
import { FlashToast } from "@/components/admin/Toast";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate, projectStatus } from "@/lib/format";
import { deleteProjectAction, setPublishedAction, updateProjectAction } from "../actions";
import { ProjectForm } from "../ProjectForm";
import { ImageManager } from "./ImageManager";

export const metadata: Metadata = { title: "Editar projeto" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ criado?: string }> };

export default async function EditProjectPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { criado } = await searchParams;
  const [project, categories] = await Promise.all([
    getProjectForAdmin(id),
    db.category.findMany({ orderBy: [{ displayOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, isActive: true } }),
  ]);
  if (!project) notFound();

  const status = projectStatus(project);
  const visibleOnSite = status === "published";

  return (
    <>
      <FlashToast message={criado ? "Projeto criado como rascunho. Agora adicione as fotos." : undefined} param="criado" />

      <Link href="/admin/projetos" className="adm-back">
        <Icon name="arrowLeft" size={16} /> Projetos
      </Link>

      <div className="adm-page-head">
        <div>
          <h1>{project.title}</h1>
          <p className="adm-sub" style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px", alignItems: "center" }}>
            <StatusBadge status={status} />
            <span>{project.category.name}</span>
            <span>· Atualizado em {formatDate(project.updatedAt)}</span>
          </p>
        </div>

        <div className="adm-actions">
          {visibleOnSite ? (
            <a href={`/projetos/${project.slug}`} target="_blank" rel="noopener noreferrer" className="adm-btn">
              <Icon name="external" size={18} /> Ver no site
            </a>
          ) : null}

          {project.published ? (
            <ActionForm action={setPublishedAction} fields={{ id: project.id, published: "false" }}>
              <ActionSubmit>
                <Icon name="eyeOff" size={18} /> Despublicar
              </ActionSubmit>
            </ActionForm>
          ) : (
            <ActionForm action={setPublishedAction} fields={{ id: project.id, published: "true" }}>
              <ActionSubmit className="adm-btn adm-btn--primary">
                <Icon name="eye" size={18} /> Publicar no site
              </ActionSubmit>
            </ActionForm>
          )}

          <ActionForm
            action={deleteProjectAction}
            fields={{ id: project.id }}
            confirm={{
              title: "Excluir este projeto?",
              message: `“${project.title}” e todas as suas ${project.images.length} foto(s) serão apagados de forma definitiva. Se você só quer tirá-lo do site, use “Despublicar”.`,
              confirmLabel: "Sim, excluir projeto",
              danger: true,
            }}
          >
            <ActionSubmit className="adm-btn adm-btn--danger">
              <Icon name="trash" size={18} /> Excluir
            </ActionSubmit>
          </ActionForm>
        </div>
      </div>

      {status === "hidden" ? (
        <div className="adm-notice" role="note">
          <Icon name="eyeOff" size={20} style={{ flex: "none", marginTop: 2 }} />
          <p>
            Este projeto está publicado, mas a categoria <strong>{project.category.name}</strong> está oculta, então ele não aparece no site.{" "}
            <Link href={`/admin/categorias/${project.category.id}`}>Mostrar a categoria</Link>.
          </p>
        </div>
      ) : null}
      {status === "draft" ? (
        <div className="adm-notice" role="note">
          <Icon name="eyeOff" size={20} style={{ flex: "none", marginTop: 2 }} />
          <p>
            {project.images.length === 0
              ? "Este projeto é um rascunho e ainda não tem fotos. Adicione as fotos abaixo e depois publique."
              : "Este projeto é um rascunho: só você o vê. Quando estiver pronto, clique em “Publicar no site”."}
          </p>
        </div>
      ) : null}

      <section className="adm-card" aria-labelledby="fotos">
        <div className="adm-card-head">
          <div>
            <h2 id="fotos">Fotos</h2>
            <p className="adm-sub">A foto marcada como “Capa” é a que aparece nos cards e na página inicial.</p>
          </div>
        </div>
        <ImageManager
          projectId={project.id}
          initialCoverId={project.coverImageId}
          initialImages={project.images.map((i) => ({ id: i.id, fileKey: i.fileKey, alt: i.alt, width: i.width, height: i.height, blurDataUrl: i.blurDataUrl }))}
        />
      </section>

      <section className="adm-card" aria-labelledby="informacoes">
        <div className="adm-card-head">
          <h2 id="informacoes">Informações do projeto</h2>
        </div>
        <ProjectForm
          categories={categories}
          action={updateProjectAction.bind(null, project.id)}
          submitLabel="Salvar alterações"
          project={{
            title: project.title,
            slug: project.slug,
            categoryId: project.categoryId,
            description: project.description,
            details: project.details,
            year: project.year,
            featured: project.featured,
          }}
        />
      </section>
    </>
  );
}
