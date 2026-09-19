"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth/guards";
import { revalidateSite } from "@/server/revalidate";
import { createProject, deleteProject, setProjectFeatured, setProjectPublished, updateProject, type ProjectInput } from "@/server/services/projects";
import { fail, type ActionResult } from "@/server/result";

function parseProjectForm(fd: FormData): ProjectInput {
  return {
    title: String(fd.get("title") ?? ""),
    slug: String(fd.get("slug") ?? ""),
    categoryId: String(fd.get("categoryId") ?? ""),
    description: String(fd.get("description") ?? ""),
    details: String(fd.get("details") ?? ""),
    year: String(fd.get("year") ?? ""),
    featured: fd.get("featured") === "on",
  };
}

export async function createProjectAction(fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const result = await createProject(parseProjectForm(fd));
  if (!result.ok) return result;
  revalidateSite();
  redirect(`/admin/projetos/${result.data!.id}?criado=1`);
}

export async function updateProjectAction(id: string, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const result = await updateProject(id, parseProjectForm(fd));
  if (result.ok) revalidateSite();
  return result;
}

export async function setPublishedAction(fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!id) return fail("Projeto não informado.");
  const result = await setProjectPublished(id, fd.get("published") === "true");
  if (result.ok) revalidateSite();
  return result;
}

export async function setFeaturedAction(fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!id) return fail("Projeto não informado.");
  const result = await setProjectFeatured(id, fd.get("featured") === "true");
  if (result.ok) revalidateSite();
  return result;
}

export async function deleteProjectAction(fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!id) return fail("Projeto não informado.");
  const result = await deleteProject(id);
  if (!result.ok) return result;
  revalidateSite();
  redirect("/admin/projetos?excluido=1");
}
