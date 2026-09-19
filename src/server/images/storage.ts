import "server-only";
import { randomBytes } from "node:crypto";
import sharp, { type Metadata as SharpMetadata } from "sharp";
import { IMAGE_WIDTHS, variantWidths } from "@/lib/media";
import { getStorage } from "./drivers";

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_INPUT_PIXELS = 60_000_000;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "heif", "tiff"]);

export class ImageError extends Error {}

export type StoredImage = {
  fileKey: string;
  width: number;
  height: number;
  blurDataUrl: string;
};

/**
 * Recebe o arquivo original enviado pelo administrador e gera versões otimizadas (WebP) em várias
 * larguras. Corrige a orientação do celular, nunca amplia a imagem e mantém a proporção original.
 * As versões são gravadas no armazenamento configurado (disco ou Supabase Storage).
 */
export async function storeImage(input: Buffer): Promise<StoredImage> {
  if (input.length > MAX_UPLOAD_BYTES) {
    throw new ImageError("A foto é muito grande. O limite é de 15 MB por arquivo.");
  }

  let meta: SharpMetadata;
  try {
    meta = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
  } catch {
    throw new ImageError("Não foi possível ler este arquivo. Envie fotos em JPG, PNG ou WebP.");
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new ImageError("Formato não suportado. Envie fotos em JPG, PNG ou WebP.");
  }

  // Aplica a rotação EXIF e descobre as dimensões finais.
  const oriented = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).rotate().toBuffer({ resolveWithObject: true });
  const maxWidth = IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];
  const width = Math.min(oriented.info.width, maxWidth);
  const height = Math.round((oriented.info.height * width) / oriented.info.width);

  const fileKey = randomBytes(12).toString("hex");
  const storage = getStorage();

  try {
    const variants = await Promise.all(
      variantWidths(width).map(async (w) => ({
        w,
        data: await sharp(oriented.data)
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: w >= 1600 ? 80 : 78, effort: 4 })
          .toBuffer(),
      })),
    );
    const blur = await sharp(oriented.data).resize({ width: 24 }).blur(1).webp({ quality: 40 }).toBuffer();

    await Promise.all(variants.map((v) => storage.put(`${fileKey}/${v.w}.webp`, v.data, "image/webp")));
    return { fileKey, width, height, blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}` };
  } catch (error) {
    await storage.removeFolder(fileKey).catch(() => {});
    throw error;
  }
}

export async function removeStoredImage(fileKey: string) {
  if (!/^[a-f0-9]{24}$/.test(fileKey)) return;
  await getStorage().removeFolder(fileKey);
}

/** Leitura pela própria aplicação (rota /media). Só o driver local serve arquivos. */
export async function readStoredFile(fileKey: string, file: string) {
  if (!/^[a-f0-9]{24}$/.test(fileKey) || !/^\d{2,4}\.webp$/.test(file)) return null;
  return getStorage().read(`${fileKey}/${file}`);
}
