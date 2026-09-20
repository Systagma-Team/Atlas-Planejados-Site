import { NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/guards";
import { removeImageOriginal, setImageOriginal } from "@/server/services/projects";
import { ImageError, MAX_UPLOAD_BYTES } from "@/server/images/storage";
import { revalidateSite } from "@/server/revalidate";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; imageId: string }> };

/** Liga (ou troca) a foto original — sem tratamento — de uma imagem do projeto. */
export async function POST(request: Request, { params }: Ctx) {
  const { admin, error } = await requireAdminApi();
  if (!admin) return error;
  const { id, imageId } = await params;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Não foi possível ler o envio. Tente novamente." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Nenhuma foto foi enviada." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "A foto é muito grande. O limite é de 15 MB por arquivo." }, { status: 400 });

  try {
    const original = await setImageOriginal(id, imageId, Buffer.from(await file.arrayBuffer()));
    revalidateSite();
    return NextResponse.json({ ok: true, ...original });
  } catch (e) {
    if (e instanceof ImageError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { admin, error } = await requireAdminApi();
  if (!admin) return error;
  const { id, imageId } = await params;

  const res = await removeImageOriginal(id, imageId);
  if (!res.ok) return NextResponse.json({ error: res.message }, { status: 404 });
  revalidateSite();
  return NextResponse.json({ ok: true, message: res.message });
}
