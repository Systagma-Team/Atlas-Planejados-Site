import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { Icon } from "@/components/ui/Icon";
import { ProjectForm } from "../ProjectForm";
import { createProjectAction } from "../actions";

export const metadata: Metadata = { title: "Novo projeto" };

export default async function NewProjectPage() {
  const categories = await db.category.findMany({ orderBy: [{ displayOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, isActive: true } });

  return (
    <>
      <Link href="/admin/projetos" className="adm-back">
        <Icon name="arrowLeft" size={16} /> Projetos
      </Link>
      <div className="adm-page-head">
        <div>
          <h1>Novo projeto</h1>
          <p className="adm-sub">Preencha as informações principais. Na próxima tela você adiciona as fotos e publica o projeto.</p>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="adm-card">
          <div className="adm-empty">
            <h2>Crie uma categoria primeiro</h2>
            <p>Todo projeto pertence a uma categoria (por exemplo, Cozinhas ou Lojas).</p>
            <Link href="/admin/categorias" className="adm-btn adm-btn--primary">
              Ir para categorias
            </Link>
          </div>
        </div>
      ) : (
        <div className="adm-card">
          <ProjectForm categories={categories} action={createProjectAction} submitLabel="Criar projeto e adicionar fotos" />
        </div>
      )}
    </>
  );
}
