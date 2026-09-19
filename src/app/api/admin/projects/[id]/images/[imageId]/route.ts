import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { requireAdminApi } from "@/server/auth/guards";
import { deleteProjectImage, setProjectCover, updateImageAlt } from "@/server/services/projects";
import { revalidateSite } from "@/server/revalidate";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; imageId: string }> };

const patchSchema = z.object({ alt: z.string().max(200).optional(), cover: z.literal(true).optional() });

/** Edita a descrição (texto alternativo) da foto ou a define como capa do projeto. */
export async function PATCH(request: Request, { params }: Ctx) {
  const { admin, error } = await requireAdminApi();
  if (!admin) return error;
  const { id, imageId } = await params;

  const body = patchSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  if (body.data.alt !== undefined) {
    const res = await updateImageAlt(id, imageId, body.data.alt);
    if (!res.ok) return NextResponse.json({ error: res.message }, { status: 404 });
  }
  if (body.data.cover) {
    const res = await setProjectCover(id, imageId);
    if (!res.ok) return NextResponse.json({ error: res.message }, { status: 404 });
  }
  revalidateSite();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { admin, error } = await requireAdminApi();
  if (!admin) return error;
  const { id, imageId } = await params;

  const res = await deleteProjectImage(id, imageId);
  if (!res.ok) return NextResponse.json({ error: res.message }, { status: 400 });
  const project = await db.project.findUnique({ where: { id }, select: { coverImageId: true, published: true } });
  revalidateSite();
  return NextResponse.json({ ok: true, message: res.message, coverImageId: project?.coverImageId ?? null, published: project?.published ?? false });
}
