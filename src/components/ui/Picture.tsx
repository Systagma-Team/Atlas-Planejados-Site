import type { CSSProperties } from "react";
import { mediaSrcSet, mediaUrl, variantWidths, type MediaImage } from "@/lib/media";
import styles from "./Picture.module.css";

type Props = {
  image: MediaImage;
  /** Atributo `sizes` do <img>: diga ao navegador quanto espaço a foto ocupa em cada largura de tela. */
  sizes: string;
  /** Foto acima da dobra (hero): carrega imediatamente com prioridade alta. */
  priority?: boolean;
  /**
   * Proporção (largura/altura) do quadro. Quando informada a foto é recortada (object-fit: cover)
   * dentro dele — use somente onde o recorte faz sentido (cards, hero). Sem ela a foto aparece inteira.
   */
  ratio?: number;
  /** Proporção alternativa para telas menores que 900px. */
  mobileRatio?: number;
  /** Preenche o elemento pai (que define o tamanho), recortando a foto. Usado no hero. */
  fill?: boolean;
  /** Ponto focal do recorte, ex.: "50% 40%". */
  position?: string;
  alt?: string;
  className?: string;
};

export function Picture({ image, sizes, priority = false, ratio, mobileRatio, fill = false, position, alt, className }: Props) {
  const widths = variantWidths(image.width);
  // Fallback para navegadores sem srcset: a versão intermediária.
  const fallback = widths.find((w) => w >= 960) ?? widths[widths.length - 1];
  const cropped = fill || ratio !== undefined;
  const blur = image.blurDataUrl ? { backgroundImage: `url("${image.blurDataUrl}")` } : undefined;

  const img = (
    <img
      src={mediaUrl(image.fileKey, fallback)}
      srcSet={mediaSrcSet(image)}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt ?? image.alt}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      className={cropped ? styles.cover : styles.natural}
      style={{ ...blur, objectPosition: cropped ? position : undefined }}
    />
  );

  const cls = (base: string) => [base, className].filter(Boolean).join(" ");
  if (fill) return <div className={cls(styles.fill)}>{img}</div>;
  if (ratio === undefined) return <div className={cls(styles.wrap)}>{img}</div>;

  const vars = { "--r": String(ratio), "--rm": String(mobileRatio ?? ratio) } as CSSProperties;
  return (
    <div className={cls(styles.frame)} style={vars}>
      {img}
    </div>
  );
}
