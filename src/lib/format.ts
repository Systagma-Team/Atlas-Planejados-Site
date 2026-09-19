export type ProjectStatus = "published" | "draft" | "hidden";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  published: "Publicado",
  draft: "Rascunho",
  hidden: "Oculto",
};

/**
 * Situação de um projeto em linguagem simples:
 *  - Rascunho: ainda não foi publicado
 *  - Oculto: está publicado, mas a categoria foi ocultada (não aparece no site)
 *  - Publicado: visível no site
 */
export function projectStatus(project: { published: boolean; category: { isActive: boolean } }): ProjectStatus {
  if (!project.published) return "draft";
  if (!project.category.isActive) return "hidden";
  return "published";
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function pluralize(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/** Quebra um texto em parágrafos (linhas em branco). */
export function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}
