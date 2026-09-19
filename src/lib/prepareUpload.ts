"use client";

/**
 * Hospedagens serverless limitam o tamanho de cada requisição (na casa de 4–6 MB). Fotos de celular/câmera
 * costumam passar disso, então o navegador reduz a foto ANTES de enviar. O servidor ainda gera todas as
 * versões otimizadas; aqui só evitamos enviar megabytes desnecessários (o site nunca mostra mais que 2400 px).
 */
const TARGET_BYTES = 3.5 * 1024 * 1024;
const ATTEMPTS: [maxSide: number, quality: number][] = [
  [2400, 0.9],
  [2400, 0.8],
  [1800, 0.8],
  [1400, 0.72],
];

export async function prepareForUpload(file: File): Promise<File> {
  if (file.size <= TARGET_BYTES) return file;
  try {
    // createImageBitmap já aplica a rotação EXIF do celular.
    const bitmap = await createImageBitmap(file);
    try {
      for (const [maxSide, quality] of ATTEMPTS) {
        const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) break;
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        // Mantém o nome original: o servidor identifica o formato pelo conteúdo, não pela extensão.
        if (blob && blob.size <= TARGET_BYTES) return new File([blob], file.name, { type: "image/jpeg" });
      }
    } finally {
      bitmap.close();
    }
  } catch {
    // Formato que o navegador não decodifica: segue com o original e o servidor decide.
  }
  return file;
}
