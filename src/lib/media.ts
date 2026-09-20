// Helpers de URL das fotos. Sem dependências de servidor: usável em componentes de cliente.
export const IMAGE_WIDTHS = [480, 960, 1600, 2400] as const;

/** Larguras realmente geradas para uma foto de `width` pixels (nunca amplia). */
export function variantWidths(width: number): number[] {
  const smaller = IMAGE_WIDTHS.filter((w) => w < width);
  return [...smaller, Math.min(width, IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1])];
}

export type MediaImage = {
  fileKey: string;
  width: number;
  height: number;
  alt: string;
  blurDataUrl: string;
  /** Foto original (sem tratamento) da mesma peça. A imagem principal é a tratada; a original só aparece se o visitante pedir. */
  original?: { fileKey: string; width: number; height: number; blurDataUrl: string } | null;
};

/**
 * Endereço-base das fotos. Sem configuração, as fotos saem pela própria aplicação (/media).
 * Com Supabase Storage, defina NEXT_PUBLIC_MEDIA_BASE_URL como a URL pública do bucket, ex.:
 * https://<projeto>.supabase.co/storage/v1/object/public/projetos  (as fotos passam a ser servidas pelo CDN).
 */
const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "/media").replace(/\/+$/, "");

export function mediaUrl(fileKey: string, width: number) {
  return `${MEDIA_BASE}/${fileKey}/${width}.webp`;
}

export function mediaSrcSet(image: Pick<MediaImage, "fileKey" | "width">) {
  return variantWidths(image.width)
    .map((w) => `${mediaUrl(image.fileKey, w)} ${w}w`)
    .join(", ");
}

/** Menor versão disponível (para miniaturas). */
export function mediaThumb(image: Pick<MediaImage, "fileKey" | "width">) {
  return mediaUrl(image.fileKey, variantWidths(image.width)[0]);
}
