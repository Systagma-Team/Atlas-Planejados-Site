import { PROJECT_STATUS_LABEL, type ProjectStatus } from "@/lib/format";

const CLASS: Record<ProjectStatus, string> = {
  published: "adm-badge--ok",
  draft: "adm-badge--draft",
  hidden: "adm-badge--hidden",
};

/** Estado em linguagem simples (Publicado, Rascunho, Oculto) — sempre com texto, nunca só cor. */
export function StatusBadge({ status, label }: { status: ProjectStatus; label?: string }) {
  return <span className={`adm-badge ${CLASS[status]}`}>{label ?? PROJECT_STATUS_LABEL[status]}</span>;
}
