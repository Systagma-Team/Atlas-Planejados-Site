import "server-only";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/server/db";
import { SLUG_PATTERN, slugify } from "@/lib/slug";
import { fail, success, zodFieldErrors, type ActionResult } from "@/server/result";

const categorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da categoria.").max(60, "Use no máximo 60 caracteres."),
  slug: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v ? v : undefined)),
  description: z.string().trim().max(300, "Use no máximo 300 caracteres.").default(""),
});

export type CategoryInput = z.input<typeof categorySchema>;

export async function listCategoriesForAdmin() {
  const categories = await db.category.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { projects: true } } },
  });
  const published = await db.project.groupBy({
    by: ["categoryId"],
    where: { published: true },
    _count: { _all: true },
  });
  const publishedMap = new Map(published.map((p) => [p.categoryId, p._count._all]));
  return categories.map((c) => ({ ...c, projectCount: c._count.projects, publishedCount: publishedMap.get(c.id) ?? 0 }));
}

export async function getCategoryForAdmin(id: string) {
  return db.category.findUnique({ where: { id }, include: { _count: { select: { projects: true } } } });
}

async function slugInUse(slug: string, ignoreId?: string) {
  const found = await db.category.findUnique({ where: { slug }, select: { id: true } });
  return !!found && found.id !== ignoreId;
}

export async function createCategory(input: CategoryInput): Promise<ActionResult<{ id: string }>> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail("Confira os campos destacados.", zodFieldErrors(parsed.error));
  const slug = parsed.data.slug ?? slugify(parsed.data.name);
  if (!SLUG_PATTERN.test(slug)) return fail("Confira os campos destacados.", { slug: "Use apenas letras minúsculas, números e hífens." });
  if (await slugInUse(slug)) return fail("Confira os campos destacados.", { slug: "Já existe uma categoria com este endereço." });

  const last = await db.category.aggregate({ _max: { displayOrder: true } });
  const category = await db.category.create({
    data: { name: parsed.data.name, slug, description: parsed.data.description, displayOrder: (last._max.displayOrder ?? -1) + 1 },
  });
  return success("Categoria criada.", { id: category.id });
}

export async function updateCategory(id: string, input: CategoryInput): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail("Confira os campos destacados.", zodFieldErrors(parsed.error));
  const existing = await db.category.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) return fail("Esta categoria não existe mais.");
  // Endereço vazio mantém o atual: renomear nunca quebra links já divulgados.
  const slug = parsed.data.slug ?? existing.slug;
  if (!SLUG_PATTERN.test(slug)) return fail("Confira os campos destacados.", { slug: "Use apenas letras minúsculas, números e hífens." });
  if (await slugInUse(slug, id)) return fail("Confira os campos destacados.", { slug: "Já existe uma categoria com este endereço." });
  try {
    await db.category.update({ where: { id }, data: { name: parsed.data.name, slug, description: parsed.data.description } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") return fail("Esta categoria não existe mais.");
    throw e;
  }
  return success("Alterações salvas.");
}

export async function setCategoryActive(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    await db.category.update({ where: { id }, data: { isActive } });
  } catch {
    return fail("Esta categoria não existe mais.");
  }
  return success(isActive ? "Categoria visível no site." : "Categoria oculta do site. Os projetos foram mantidos.");
}

/** Move a categoria uma posição para cima/baixo trocando a ordem com a vizinha. */
export async function moveCategory(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const all = await db.category.findMany({ orderBy: [{ displayOrder: "asc" }, { name: "asc" }], select: { id: true } });
  const index = all.findIndex((c) => c.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= all.length) return success();
  const reordered = [...all];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  await db.$transaction(reordered.map((c, i) => db.category.update({ where: { id: c.id }, data: { displayOrder: i } })));
  return success("Ordem atualizada.");
}

/**
 * Exclusão definitiva: exceção, só para categorias SEM nenhum projeto.
 * O banco também recusa (onDelete: Restrict), então nunca sobram projetos órfãos.
 */
export async function deleteEmptyCategory(id: string): Promise<ActionResult> {
  const count = await db.project.count({ where: { categoryId: id } });
  if (count > 0) {
    return fail(`Esta categoria tem ${count} projeto(s) e não pode ser excluída. Oculte-a do site, se preferir.`);
  }
  try {
    await db.category.delete({ where: { id } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return fail("Esta categoria ainda está em uso e não pode ser excluída.");
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") return success("Categoria já havia sido removida.");
    throw e;
  }
  return success("Categoria excluída.");
}
