import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";
import { getSettings } from "@/server/services/settings";
import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate, projectStatus } from "@/lib/format";
import { mediaThumb } from "@/lib/media";

export const metadata: Metadata = { title: "Painel" };

export default async function DashboardPage() {
  const [total, published, drafts, categories, hiddenCategories, recent, settings] = await Promise.all([
    db.project.count(),
    db.project.count({ where: { published: true, category: { isActive: true } } }),
    db.project.count({ where: { published: false } }),
    db.category.count(),
    db.category.count({ where: { isActive: false } }),
    db.project.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { category: true, coverImage: true, images: { orderBy: { displayOrder: "asc" }, take: 1 } },
    }),
    getSettings(),
  ]);

  const hasContact = !!(settings.whatsapp || settings.phone || settings.email);
  const stats = [
    { label: "Projetos no total", value: total },
    { label: "Publicados no site", value: published },
    { label: "Em rascunho", value: drafts },
    { label: "Categorias", value: categories },
    { label: "Categorias ocultas", value: hiddenCategories },
  ];

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Olá! Este é o seu painel.</h1>
          <p className="adm-sub">Aqui você cadastra projetos, organiza as categorias e mantém o site sempre atualizado.</p>
        </div>
        <div className="adm-actions">
          <Link href="/admin/projetos/novo" className="adm-btn adm-btn--primary">
            <Icon name="plus" size={18} /> Novo projeto
          </Link>
        </div>
      </div>

      {!hasContact ? (
        <div className="adm-notice" role="note">
          <Icon name="phone" size={20} style={{ flex: "none", marginTop: 2 }} />
          <p>
            O site ainda não mostra telefone, WhatsApp ou e-mail para os clientes.{" "}
            <Link href="/admin/configuracoes">Preencha as informações de contato</Link>.
          </p>
        </div>
      ) : null}

      <div className="adm-stats">
        {stats.map((s) => (
          <div key={s.label} className="adm-stat">
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <section className="adm-card" aria-labelledby="recentes">
        <div className="adm-card-head">
          <h2 id="recentes">Projetos recentes</h2>
          <Link href="/admin/projetos" className="adm-btn adm-btn--sm">
            Ver todos
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="adm-empty">
            <h2>Nenhum projeto cadastrado ainda</h2>
            <p>Cadastre o primeiro projeto para que ele possa aparecer no site.</p>
            <Link href="/admin/projetos/novo" className="adm-btn adm-btn--primary">
              Cadastrar projeto
            </Link>
          </div>
        ) : (
          <div className="adm-list" style={{ border: 0, borderRadius: 0 }}>
            {recent.map((p) => {
              const cover = p.coverImage ?? p.images[0];
              return (
                <div key={p.id} className="adm-item" style={{ paddingInline: 0 }}>
                  <div className={`adm-thumb ${cover ? "" : "adm-thumb--empty"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {cover ? <img src={mediaThumb(cover)} alt="" /> : <Icon name="image" size={24} />}
                  </div>
                  <div className="adm-item-main">
                    <Link href={`/admin/projetos/${p.id}`} className="adm-item-title">
                      {p.title}
                    </Link>
                    <div className="adm-meta">
                      <span>{p.category.name}</span>
                      <span>Atualizado em {formatDate(p.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="adm-item-side">
                    <StatusBadge status={projectStatus(p)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
