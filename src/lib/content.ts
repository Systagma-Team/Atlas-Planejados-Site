import data from "@/generated/conteudo.json";
import type { MediaImage } from "@/lib/media";

/**
 * Leitura do conteúdo do site. Os dados vêm da pasta conteudo/ (veja o README): `npm run conteudo` confere tudo e
 * gera src/generated/conteudo.json, que é lido aqui na hora de montar as páginas estáticas.
 *
 * Regra única de visibilidade, aplicada em todos os lugares: um projeto só aparece se estiver publicado,
 * sua categoria estiver ativa e ele tiver ao menos uma foto.
 */

// ---------- Informações da empresa ----------
export type SiteSettings = {
  whatsapp: string;
  whatsapp2: string;
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  address: string;
  openingHours: string;
  mapEmbedUrl: string;
  aboutText: string;
};

type RawSettings = {
  urlDoSite: string;
  whatsapp: string;
  whatsapp2: string;
  telefone: string;
  email: string;
  instagram: string;
  facebook: string;
  endereco: string;
  horarioDeAtendimento: string;
  mapaGoogle: string;
  textoSobre: string[];
};

const raw = data.settings as RawSettings;

export function getSettings(): SiteSettings {
  return {
    whatsapp: raw.whatsapp,
    whatsapp2: raw.whatsapp2,
    phone: raw.telefone,
    email: raw.email,
    instagram: raw.instagram,
    facebook: raw.facebook,
    address: raw.endereco,
    openingHours: raw.horarioDeAtendimento,
    mapEmbedUrl: raw.mapaGoogle,
    aboutText: raw.textoSobre.join("\n\n"),
  };
}

/** Endereço do site (conteudo/site.json → urlDoSite, ou a variável SITE_URL no build). */
export function configuredSiteUrl() {
  return (process.env.SITE_URL || raw.urlDoSite || "").replace(/\/$/, "");
}

// ---------- Categorias e projetos ----------
type RawCategory = { slug: string; nome: string; descricao: string; ativa: boolean };
type RawProject = {
  slug: string;
  title: string;
  category: string;
  description: string;
  details: string[];
  featured: boolean;
  published: boolean;
  year: number | null;
  date: string;
  images: (MediaImage & { original: NonNullable<MediaImage["original"]> | null })[];
};

const rawCategories = data.categories as RawCategory[];
const rawProjects = data.projects as unknown as RawProject[];

const activeCategorySlugs = new Set(rawCategories.filter((c) => c.ativa).map((c) => c.slug));
const categoryBySlug = new Map(rawCategories.map((c) => [c.slug, c]));

const visible = rawProjects.filter((p) => p.published && p.images.length > 0 && activeCategorySlugs.has(p.category));

// Mais recente primeiro (data e, em caso de empate, título).
const byRecent = (a: RawProject, b: RawProject) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, "pt-BR");
const byFeaturedThenRecent = (a: RawProject, b: RawProject) => Number(b.featured) - Number(a.featured) || byRecent(a, b);

export type CategoryRef = { id: string; name: string; slug: string };

export type ProjectCardData = {
  id: string;
  title: string;
  slug: string;
  description: string;
  year: number | null;
  category: CategoryRef;
  cover: MediaImage;
};

function categoryRef(slug: string): CategoryRef {
  const c = categoryBySlug.get(slug)!;
  return { id: c.slug, name: c.nome, slug: c.slug };
}

function toCard(p: RawProject): ProjectCardData {
  const cover = p.images[0]; // a primeira foto é a capa
  return {
    id: p.slug,
    title: p.title,
    slug: p.slug,
    description: p.description,
    year: p.year,
    category: categoryRef(p.category),
    cover: { ...cover, alt: cover.alt || p.title },
  };
}

export function getFeaturedProjects(limit = 6): ProjectCardData[] {
  return visible
    .filter((p) => p.featured)
    .sort(byRecent)
    .slice(0, limit)
    .map(toCard);
}

/** Categorias ativas que têm ao menos um projeto visível, na ordem do arquivo categorias.json. */
export function getActiveCategories() {
  return rawCategories
    .filter((c) => c.ativa)
    .map((c) => ({ id: c.slug, name: c.nome, slug: c.slug, description: c.descricao, count: visible.filter((p) => p.category === c.slug).length }))
    .filter((c) => c.count > 0);
}

/** Categoria com uma foto de capa representativa (usada na Home). */
export function getCategoriesWithCover() {
  return getActiveCategories().map((c) => {
    const project = visible.filter((p) => p.category === c.slug).sort(byFeaturedThenRecent)[0];
    return { ...c, cover: project ? toCard(project).cover : null };
  });
}

export function getPublishedProjects(categorySlug?: string): ProjectCardData[] {
  return visible
    .filter((p) => !categorySlug || p.category === categorySlug)
    .sort(byFeaturedThenRecent)
    .map(toCard);
}

export function getPublishedProjectBySlug(slug: string) {
  const p = visible.find((x) => x.slug === slug);
  if (!p) return null;
  const card = toCard(p);
  return {
    id: p.slug,
    title: p.title,
    slug: p.slug,
    description: p.description,
    details: p.details.join("\n\n"),
    year: p.year,
    createdAt: new Date(p.date),
    updatedAt: new Date(p.date),
    category: card.category,
    cover: card.cover,
    images: p.images.map((i): MediaImage => ({ ...i, alt: i.alt || p.title })),
  };
}

/** Projetos da mesma categoria (ou mais recentes) para "Ver também" na página do projeto. */
export function getRelatedProjects(projectId: string, categoryId: string, limit = 3): ProjectCardData[] {
  const others = visible.filter((p) => p.slug !== projectId).sort(byRecent);
  const same = others.filter((p) => p.category === categoryId);
  const rest = others.filter((p) => p.category !== categoryId);
  return [...same, ...rest].slice(0, limit).map(toCard);
}

export function getAllProjectSlugs() {
  return visible.map((p) => p.slug);
}

export function getSitemapEntries() {
  return { projects: visible.map((p) => ({ slug: p.slug, updatedAt: new Date(p.date) })), categories: getActiveCategories() };
}

/** Há alguma foto original ligada a um projeto visível? (controla o aviso "imagens tratadas" no site) */
export function hasOriginalPhotos() {
  return visible.some((p) => p.images.some((i) => i.original));
}
