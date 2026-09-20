import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import type { MediaImage } from "@/lib/media";

/**
 * Consultas do site público. Regra única de visibilidade, aplicada em todos os lugares:
 * um projeto só aparece se estiver publicado E sua categoria estiver ativa.
 */
export const visibleProject = { published: true, category: { isActive: true } } satisfies Prisma.ProjectWhereInput;

const imageSelect = { fileKey: true, width: true, height: true, alt: true, blurDataUrl: true } as const;
// Galeria da página do projeto: inclui a foto original ligada a cada imagem.
const galleryImageSelect = { ...imageSelect, originalFileKey: true, originalWidth: true, originalHeight: true, originalBlurDataUrl: true } as const;

const cardSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  year: true,
  featured: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true } },
  coverImage: { select: imageSelect },
  images: { select: imageSelect, orderBy: { displayOrder: "asc" }, take: 1 },
} satisfies Prisma.ProjectSelect;

export type ProjectCardData = {
  id: string;
  title: string;
  slug: string;
  description: string;
  year: number | null;
  category: { id: string; name: string; slug: string };
  cover: MediaImage;
};

type CardRow = Prisma.ProjectGetPayload<{ select: typeof cardSelect }>;

function toCard(row: CardRow): ProjectCardData | null {
  const cover = row.coverImage ?? row.images[0];
  if (!cover) return null; // projeto sem foto nunca aparece
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    year: row.year,
    category: row.category,
    cover: { ...cover, alt: cover.alt || row.title },
  };
}

const compact = (list: (ProjectCardData | null)[]) => list.filter((p): p is ProjectCardData => p !== null);

export async function getFeaturedProjects(limit = 6) {
  const rows = await db.project.findMany({
    where: { ...visibleProject, featured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: cardSelect,
  });
  return compact(rows.map(toCard));
}

export async function getActiveCategories() {
  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      projects: { where: { published: true }, select: { id: true } },
    },
  });
  // Categorias sem nenhum projeto visível não são listadas no site.
  return categories
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug, description: c.description, count: c.projects.length }))
    .filter((c) => c.count > 0);
}

/** Categoria com uma foto de capa representativa (usada na Home). */
export async function getCategoriesWithCover() {
  const categories = await getActiveCategories();
  const covers = await Promise.all(
    categories.map(async (c) => {
      const row = await db.project.findFirst({
        where: { ...visibleProject, categoryId: c.id },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        select: cardSelect,
      });
      return { ...c, cover: row ? (toCard(row)?.cover ?? null) : null };
    }),
  );
  return covers;
}

export async function getPublishedProjects(categorySlug?: string) {
  const rows = await db.project.findMany({
    where: { ...visibleProject, ...(categorySlug ? { category: { isActive: true, slug: categorySlug } } : {}) },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    select: cardSelect,
  });
  return compact(rows.map(toCard));
}

export async function getPublishedProjectBySlug(slug: string) {
  const project = await db.project.findFirst({
    where: { ...visibleProject, slug },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      details: true,
      year: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { id: true, name: true, slug: true } },
      coverImage: { select: imageSelect },
      images: { select: galleryImageSelect, orderBy: { displayOrder: "asc" } },
    },
  });
  if (!project || project.images.length === 0) return null;
  const cover = project.coverImage ?? project.images[0];
  const images: MediaImage[] = project.images.map((i) => ({
    fileKey: i.fileKey,
    width: i.width,
    height: i.height,
    blurDataUrl: i.blurDataUrl,
    alt: i.alt || project.title,
    original:
      i.originalFileKey && i.originalWidth && i.originalHeight
        ? { fileKey: i.originalFileKey, width: i.originalWidth, height: i.originalHeight, blurDataUrl: i.originalBlurDataUrl }
        : null,
  }));
  return {
    ...project,
    cover: { ...cover, alt: cover.alt || project.title },
    images,
  };
}

/** Projetos da mesma categoria (ou mais recentes) para "Ver também" na página do projeto. */
export async function getRelatedProjects(projectId: string, categoryId: string, limit = 3) {
  const same = await db.project.findMany({
    where: { ...visibleProject, categoryId, NOT: { id: projectId } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: cardSelect,
  });
  let cards = compact(same.map(toCard));
  if (cards.length < limit) {
    const others = await db.project.findMany({
      where: { ...visibleProject, NOT: [{ id: projectId }, { categoryId }] },
      orderBy: { createdAt: "desc" },
      take: limit - cards.length,
      select: cardSelect,
    });
    cards = [...cards, ...compact(others.map(toCard))];
  }
  return cards;
}

export async function getSitemapEntries() {
  const [projects, categories] = await Promise.all([
    db.project.findMany({ where: visibleProject, select: { slug: true, updatedAt: true } }),
    getActiveCategories(),
  ]);
  return { projects, categories };
}

/** Há alguma foto original ligada a um projeto visível? (controla o aviso "imagens tratadas" no site) */
export async function hasOriginalPhotos() {
  const count = await db.projectImage.count({ where: { originalFileKey: { not: null }, project: visibleProject } });
  return count > 0;
}
