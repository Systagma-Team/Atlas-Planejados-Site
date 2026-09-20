import "server-only";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/server/db";
import { SLUG_PATTERN, slugify } from "@/lib/slug";
import { fail, success, zodFieldErrors, type ActionResult } from "@/server/result";
import { ImageError, removeStoredImage, storeImage } from "@/server/images/storage";

const currentYear = new Date().getFullYear();

const projectSchema = z.object({
  title: z.string().trim().min(3, "Informe o título do projeto.").max(120, "Use no máximo 120 caracteres."),
  slug: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v ? v : undefined)),
  categoryId: z.string().min(1, "Escolha uma categoria."),
  description: z.string().trim().max(400, "Use no máximo 400 caracteres.").default(""),
  details: z.string().trim().max(6000, "Texto longo demais.").default(""),
  year: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 1980 && v <= currentYear + 1), "Informe um ano válido."),
  featured: z.boolean().default(false),
  // Omitido = mantém a situação atual (a publicação tem botão próprio no painel).
  published: z.boolean().optional(),
});

export type ProjectInput = z.input<typeof projectSchema>;

export async function listProjectsForAdmin() {
  return db.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      category: true,
      coverImage: true,
      images: { orderBy: { displayOrder: "asc" }, take: 1 },
      _count: { select: { images: true } },
    },
  });
}

export async function getProjectForAdmin(id: string) {
  return db.project.findUnique({
    where: { id },
    include: { category: true, coverImage: true, images: { orderBy: { displayOrder: "asc" } } },
  });
}

async function uniqueSlug(base: string) {
  const root = base || "projeto";
  let slug = root;
  let n = 2;
  while (await db.project.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${root}-${n++}`;
  }
  return slug;
}

export async function createProject(input: ProjectInput): Promise<ActionResult<{ id: string }>> {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return fail("Confira os campos destacados.", zodFieldErrors(parsed.error));
  const d = parsed.data;

  const category = await db.category.findUnique({ where: { id: d.categoryId }, select: { id: true } });
  if (!category) return fail("Confira os campos destacados.", { categoryId: "Escolha uma categoria válida." });

  let slug: string;
  if (d.slug) {
    if (!SLUG_PATTERN.test(d.slug)) return fail("Confira os campos destacados.", { slug: "Use apenas letras minúsculas, números e hífens." });
    if (await db.project.findUnique({ where: { slug: d.slug }, select: { id: true } })) {
      return fail("Confira os campos destacados.", { slug: "Já existe um projeto com este endereço." });
    }
    slug = d.slug;
  } else {
    slug = await uniqueSlug(slugify(d.title));
  }

  // Um projeto novo não tem fotos ainda, então nasce como rascunho.
  const project = await db.project.create({
    data: {
      title: d.title,
      slug,
      categoryId: d.categoryId,
      description: d.description,
      details: d.details,
      year: d.year,
      featured: d.featured,
      published: false,
    },
  });
  return success("Projeto criado como rascunho. Agora adicione as fotos.", { id: project.id });
}

export async function updateProject(id: string, input: ProjectInput): Promise<ActionResult> {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return fail("Confira os campos destacados.", zodFieldErrors(parsed.error));
  const d = parsed.data;

  const existing = await db.project.findUnique({ where: { id }, select: { id: true, slug: true, _count: { select: { images: true } } } });
  if (!existing) return fail("Este projeto não existe mais.");

  const category = await db.category.findUnique({ where: { id: d.categoryId }, select: { id: true } });
  if (!category) return fail("Confira os campos destacados.", { categoryId: "Escolha uma categoria válida." });

  // Endereço vazio mantém o atual: mudar o título nunca quebra links já divulgados.
  const slug = d.slug ?? existing.slug;
  if (!SLUG_PATTERN.test(slug)) return fail("Confira os campos destacados.", { slug: "Use apenas letras minúsculas, números e hífens." });
  const clash = await db.project.findUnique({ where: { slug }, select: { id: true } });
  if (clash && clash.id !== id) return fail("Confira os campos destacados.", { slug: "Já existe um projeto com este endereço." });

  if (d.published === true && existing._count.images === 0) {
    return fail("Adicione pelo menos uma foto antes de publicar o projeto.");
  }

  await db.project.update({
    where: { id },
    data: {
      title: d.title,
      slug,
      categoryId: d.categoryId,
      description: d.description,
      details: d.details,
      year: d.year,
      featured: d.featured,
      ...(d.published !== undefined ? { published: d.published } : {}),
    },
  });
  return success("Alterações salvas.");
}

export async function setProjectPublished(id: string, published: boolean): Promise<ActionResult> {
  const project = await db.project.findUnique({ where: { id }, select: { _count: { select: { images: true } } } });
  if (!project) return fail("Este projeto não existe mais.");
  if (published && project._count.images === 0) return fail("Adicione pelo menos uma foto antes de publicar o projeto.");
  await db.project.update({ where: { id }, data: { published } });
  return success(published ? "Projeto publicado no site." : "Projeto despublicado. Ele continua salvo aqui no painel.");
}

export async function setProjectFeatured(id: string, featured: boolean): Promise<ActionResult> {
  try {
    await db.project.update({ where: { id }, data: { featured } });
  } catch {
    return fail("Este projeto não existe mais.");
  }
  return success(featured ? "Projeto em destaque na página inicial." : "Projeto retirado dos destaques.");
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const project = await db.project.findUnique({ where: { id }, select: { images: { select: { fileKey: true, originalFileKey: true } } } });
  if (!project) return success("Projeto já havia sido excluído.");
  await db.project.delete({ where: { id } });
  await Promise.all(project.images.flatMap((i) => [removeStoredImage(i.fileKey), i.originalFileKey ? removeStoredImage(i.originalFileKey) : Promise.resolve()]));
  return success("Projeto excluído.");
}

/* ------------------------------- Fotos ------------------------------- */

export async function addProjectImages(projectId: string, files: { buffer: Buffer; name: string }[]) {
  const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true, coverImageId: true } });
  if (!project) throw new ImageError("Projeto não encontrado.");

  const last = await db.projectImage.aggregate({ where: { projectId }, _max: { displayOrder: true } });
  let order = (last._max.displayOrder ?? -1) + 1;
  let coverImageId = project.coverImageId;
  const added: { id: string }[] = [];
  const errors: { name: string; message: string }[] = [];

  for (const file of files) {
    let stored: Awaited<ReturnType<typeof storeImage>> | null = null;
    try {
      stored = await storeImage(file.buffer);
      const image = await db.projectImage.create({ data: { projectId, displayOrder: order++, alt: "", ...stored } });
      added.push({ id: image.id });
      if (!coverImageId) {
        await db.project.update({ where: { id: projectId }, data: { coverImageId: image.id } });
        coverImageId = image.id;
      }
    } catch (e) {
      if (stored) await removeStoredImage(stored.fileKey);
      errors.push({ name: file.name, message: e instanceof ImageError ? e.message : "Não foi possível enviar esta foto." });
    }
  }
  return { added, errors };
}

export async function deleteProjectImage(projectId: string, imageId: string): Promise<ActionResult> {
  const image = await db.projectImage.findFirst({ where: { id: imageId, projectId }, select: { id: true, fileKey: true, originalFileKey: true } });
  if (!image) return success();
  const project = await db.project.findUnique({ where: { id: projectId }, select: { coverImageId: true, published: true } });
  const remaining = await db.projectImage.findMany({
    where: { projectId, NOT: { id: imageId } },
    orderBy: { displayOrder: "asc" },
    select: { id: true },
  });

  const backToDraft = remaining.length === 0 && !!project?.published;
  await db.$transaction(async (tx) => {
    await tx.projectImage.delete({ where: { id: imageId } });
    const data: Prisma.ProjectUpdateInput = {};
    if (project?.coverImageId === imageId) data.coverImage = remaining[0] ? { connect: { id: remaining[0].id } } : { disconnect: true };
    // Sem fotos, um projeto publicado volta a ser rascunho para não aparecer vazio no site.
    if (backToDraft) data.published = false;
    if (Object.keys(data).length) await tx.project.update({ where: { id: projectId }, data });
  });
  await removeStoredImage(image.fileKey);
  if (image.originalFileKey) await removeStoredImage(image.originalFileKey);
  return success(backToDraft ? "Foto removida. Sem fotos, o projeto voltou para rascunho." : "Foto removida.");
}

export async function reorderProjectImages(projectId: string, orderedIds: string[]): Promise<ActionResult> {
  const current = await db.projectImage.findMany({ where: { projectId }, select: { id: true } });
  const currentIds = new Set(current.map((i) => i.id));
  if (orderedIds.length !== currentIds.size || !orderedIds.every((id) => currentIds.has(id))) {
    return fail("A lista de fotos mudou. Atualize a página e tente novamente.");
  }
  await db.$transaction(orderedIds.map((id, index) => db.projectImage.update({ where: { id }, data: { displayOrder: index } })));
  return success("Ordem das fotos salva.");
}

export async function setProjectCover(projectId: string, imageId: string): Promise<ActionResult> {
  const image = await db.projectImage.findFirst({ where: { id: imageId, projectId }, select: { id: true } });
  if (!image) return fail("Foto não encontrada.");
  await db.project.update({ where: { id: projectId }, data: { coverImageId: imageId } });
  return success("Capa atualizada.");
}

export async function updateImageAlt(projectId: string, imageId: string, alt: string): Promise<ActionResult> {
  const clean = alt.trim().slice(0, 200);
  const res = await db.projectImage.updateMany({ where: { id: imageId, projectId }, data: { alt: clean } });
  if (res.count === 0) return fail("Foto não encontrada.");
  return success("Descrição da foto salva.");
}

/* ------------------------- Foto original (sem tratamento) ------------------------- */

/**
 * Liga a foto ORIGINAL da peça a uma imagem do projeto. O site mostra a imagem tratada por padrão e só
 * revela a original quando o visitante escolher "Ver foto original". Substitui a anterior, se houver.
 */
export async function setImageOriginal(projectId: string, imageId: string, buffer: Buffer) {
  const image = await db.projectImage.findFirst({ where: { id: imageId, projectId }, select: { id: true, originalFileKey: true } });
  if (!image) throw new ImageError("Foto não encontrada.");

  const stored = await storeImage(buffer);
  try {
    await db.projectImage.update({
      where: { id: imageId },
      data: { originalFileKey: stored.fileKey, originalWidth: stored.width, originalHeight: stored.height, originalBlurDataUrl: stored.blurDataUrl },
    });
  } catch (e) {
    await removeStoredImage(stored.fileKey);
    throw e;
  }
  if (image.originalFileKey) await removeStoredImage(image.originalFileKey);
  return { originalFileKey: stored.fileKey, originalWidth: stored.width, originalHeight: stored.height };
}

export async function removeImageOriginal(projectId: string, imageId: string): Promise<ActionResult> {
  const image = await db.projectImage.findFirst({ where: { id: imageId, projectId }, select: { originalFileKey: true } });
  if (!image) return fail("Foto não encontrada.");
  if (!image.originalFileKey) return success();
  await db.projectImage.update({
    where: { id: imageId },
    data: { originalFileKey: null, originalWidth: null, originalHeight: null, originalBlurDataUrl: "" },
  });
  await removeStoredImage(image.originalFileKey);
  return success("Foto original removida.");
}
