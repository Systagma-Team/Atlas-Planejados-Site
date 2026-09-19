import { NextResponse } from "next/server";
import { readStoredFile } from "@/server/images/storage";

// As fotos são gravadas com um nome único (fileKey) e nunca mudam: podem ser guardadas em cache para sempre.
export async function GET(request: Request, { params }: { params: Promise<{ key: string; file: string }> }) {
  const { key, file } = await params;

  // Com armazenamento externo (Supabase), as fotos são servidas pelo CDN do bucket: redireciona links antigos.
  const external = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
  if (external && /^https?:\/\//.test(external) && /^[a-f0-9]{24}$/.test(key) && /^\d{2,4}\.webp$/.test(file)) {
    return NextResponse.redirect(`${external.replace(/\/+$/, "")}/${key}/${file}`, 308);
  }

  const stored = await readStoredFile(key, file);
  if (!stored) return new NextResponse("Not found", { status: 404 });

  const etag = `"${key}-${file}-${stored.size}"`;
  const headers = {
    "Content-Type": "image/webp",
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
  };
  if (request.headers.get("if-none-match") === etag) return new NextResponse(null, { status: 304, headers });

  return new NextResponse(new Uint8Array(stored.data), { headers: { ...headers, "Content-Length": String(stored.size) } });
}
