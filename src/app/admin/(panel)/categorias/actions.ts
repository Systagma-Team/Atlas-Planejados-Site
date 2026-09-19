"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth/guards";
import { revalidateSite } from "@/server/revalidate";
import { createCategory, deleteEmptyCategory, moveCategory, setCategoryActive, updateCategory, type CategoryInput } from "@/server/services/categories";
import { fail, type ActionResult } from "@/server/result";

function parseCategoryForm(fd: FormData): CategoryInput {
  return {
    name: String(fd.get("name") ?? ""),
    slug: String(fd.get("slug") ?? ""),
    description: String(fd.get("description") ?? ""),
  };
}

export async function createCategoryAction(fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const result = await createCategory(parseCategoryForm(fd));
  if (!result.ok) return result;
  revalidateSite();
  redirect("/admin/categorias?criada=1");
}

export async function updateCategoryAction(id: string, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const result = await updateCategory(id, parseCategoryForm(fd));
  if (result.ok) revalidateSite();
  return result;
}

export async function setCategoryActiveAction(fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!id) return fail("Categoria não informada.");
  const result = await setCategoryActive(id, fd.get("active") === "true");
  if (result.ok) revalidateSite();
  return result;
}

export async function moveCategoryAction(fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const direction = fd.get("direction") === "up" ? "up" : "down";
  const result = await moveCategory(id, direction);
  if (result.ok) revalidateSite();
  return result;
}

/** Exceção: só funciona para categorias sem nenhum projeto. */
export async function deleteCategoryAction(fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!id) return fail("Categoria não informada.");
  const result = await deleteEmptyCategory(id);
  if (!result.ok) return result;
  revalidateSite();
  redirect("/admin/categorias?excluida=1");
}
