import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { requireAdminApi } from "@/server/auth/guards";
import { addProjectImages } from "@/server/services/projects";
import { MAX_UPLOAD_BYTES } from "@/server/images/storage";
import { revalidateSite } from "@/server/revalidate";

export const runtime = "nodejs";
const MAX_FILES_PER_REQUEST = 12;

/** Envia uma ou mais fotos para o projeto. Cada foto é otimizada e gravada em várias larguras. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin, error } = await requireAdminApi();
  if (!admin) return error;
  const { id } = await params;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Não foi possível ler o envio. Tente novamente com menos fotos." }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return NextResponse.json({ error: "Nenhuma foto foi enviada." }, { status: 400 });
  if (files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json({ error: `Envie no máximo ${MAX_FILES_PER_REQUEST} fotos por vez.` }, { status: 400 });
  }

  const tooBig = files.filter((f) => f.size > MAX_UPLOAD_BYTES);
  const acceptable = files.filter((f) => f.size <= MAX_UPLOAD_BYTES);
  const buffers = await Promise.all(acceptable.map(async (f) => ({ buffer: Buffer.from(await f.arrayBuffer()), name: f.name })));

  const exists = await db.project.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });

  const result = await addProjectImages(id, buffers);
  const rows = await db.projectImage.findMany({
    where: { id: { in: result.added.map((a) => a.id) } },
    orderBy: { displayOrder: "asc" },
    select: { id: true, fileKey: true, alt: true, width: true, height: true, blurDataUrl: true, displayOrder: true },
  });
  const project = await db.project.findUnique({ where: { id }, select: { coverImageId: true } });

  revalidateSite();
  return NextResponse.json({
    images: rows,
    coverImageId: project?.coverImageId ?? null,
    errors: [...result.errors, ...tooBig.map((f) => ({ name: f.name, message: "A foto é muito grande. O limite é de 15 MB por arquivo." }))],
  });
}
