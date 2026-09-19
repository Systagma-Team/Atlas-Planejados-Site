import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/server/auth/guards";
import { reorderProjectImages } from "@/server/services/projects";
import { revalidateSite } from "@/server/revalidate";

export const runtime = "nodejs";

const schema = z.object({ order: z.array(z.string().min(1)).min(1).max(200) });

/** Salva a nova ordem das fotos da galeria. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin, error } = await requireAdminApi();
  if (!admin) return error;
  const { id } = await params;

  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const res = await reorderProjectImages(id, body.data.order);
  if (!res.ok) return NextResponse.json({ error: res.message }, { status: 409 });
  revalidateSite();
  return NextResponse.json({ ok: true });
}
