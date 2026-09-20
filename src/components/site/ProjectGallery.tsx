"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Picture } from "@/components/ui/Picture";
import { mediaSrcSet, mediaUrl, variantWidths, type MediaImage } from "@/lib/media";
import styles from "./ProjectGallery.module.css";

type Slot = { image: MediaImage; index: number; span: number; start?: number };
type View = "tratada" | "original";

/**
 * Distribui as fotos em uma grade de 12 colunas respeitando a proporção real de cada uma:
 * panorâmicas ocupam a largura toda, retratos formam pares e quadradas ficam centralizadas.
 * Nada é recortado: cada foto aparece inteira.
 */
function arrange(images: MediaImage[]): Slot[] {
  const slots: Slot[] = [];
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const ratio = image.width / image.height;
    if (ratio < 0.85) {
      const next = images[i + 1];
      if (next && next.width / next.height < 0.85) {
        slots.push({ image, index: i, span: 6 }, { image: next, index: i + 1, span: 6 });
        i++;
      } else {
        slots.push({ image, index: i, span: 6, start: 4 });
      }
    } else if (ratio < 1.15) {
      slots.push({ image, index: i, span: 8, start: 3 });
    } else {
      slots.push({ image, index: i, span: 12 });
    }
  }
  return slots;
}

export function ProjectGallery({ images, title }: { images: MediaImage[]; title: string }) {
  const [current, setCurrent] = useState<number | null>(null);
  // A imagem tratada é sempre a padrão; a original só aparece quando a pessoa escolhe vê-la.
  const [view, setView] = useState<View>("tratada");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const slots = arrange(images);

  const open = (index: number, el: HTMLElement, initialView: View = "tratada") => {
    openerRef.current = el;
    setView(initialView);
    setCurrent(index);
  };

  const close = useCallback(() => setCurrent(null), []);
  const go = useCallback(
    (delta: number) => {
      setView("tratada");
      setCurrent((c) => (c === null ? c : (c + delta + images.length) % images.length));
    },
    [images.length],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (current !== null && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    }
    if (current === null && dialog.open) {
      dialog.close();
    }
  }, [current]);

  // Ao fechar (Esc, botão ou clique fora), devolve o foco ao item que abriu.
  const onClosed = () => {
    document.body.style.overflow = "";
    setCurrent(null);
    openerRef.current?.focus();
  };

  useEffect(() => {
    if (current === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, go]);

  const active = current !== null ? images[current] : null;
  const showingOriginal = !!active?.original && view === "original";
  const shown = active ? (showingOriginal ? active.original! : active) : null;
  const largest = shown ? variantWidths(shown.width).at(-1)! : 0;

  return (
    <>
      <ul className={styles.grid}>
        {slots.map((slot) => (
          <li
            key={slot.image.fileKey}
            className={styles.cell}
            style={{ ["--span" as string]: slot.span, ["--start" as string]: slot.start ?? "auto" }}
          >
            <button
              type="button"
              className={styles.open}
              onClick={(e) => open(slot.index, e.currentTarget)}
              aria-label={`Ampliar foto ${slot.index + 1} de ${images.length}: ${slot.image.alt}`}
            >
              <Picture
                image={slot.image}
                priority={slot.index === 0}
                alt=""
                sizes={slot.span === 12 ? "(min-width: 1280px) 1280px, 100vw" : "(min-width: 1280px) 640px, (min-width: 900px) 50vw, 100vw"}
              />
              <span className={styles.zoom} aria-hidden="true">
                <Icon name="plus" size={20} />
              </span>
            </button>

            {slot.image.original ? (
              <button
                type="button"
                className={styles.originalBtn}
                onClick={(e) => open(slot.index, e.currentTarget, "original")}
                aria-label={`Ver a foto original de: ${slot.image.alt}`}
              >
                <Icon name="image" size={16} />
                Ver foto original
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      <dialog ref={dialogRef} className={styles.dialog} aria-label={`Fotos do projeto ${title}`} onClose={onClosed} onClick={(e) => e.target === e.currentTarget && close()}>
        {active && shown ? (
          <div className={styles.stage}>
            <img
              key={`${shown.fileKey}`}
              className={styles.big}
              src={mediaUrl(shown.fileKey, largest)}
              srcSet={mediaSrcSet(shown)}
              sizes="100vw"
              alt={showingOriginal ? `${active.alt} (foto original, sem tratamento)` : active.alt}
              width={shown.width}
              height={shown.height}
            />
            <p className={styles.counter} aria-live="polite">
              {(current ?? 0) + 1} / {images.length}
              {active.original ? <span className={styles.caption}> · {showingOriginal ? "Foto original, sem tratamento" : "Imagem tratada digitalmente"}</span> : null}
            </p>
          </div>
        ) : null}

        {active?.original ? (
          <div role="group" aria-label="Versão da imagem" className={styles.switch}>
            <button type="button" aria-pressed={!showingOriginal} onClick={() => setView("tratada")}>
              Imagem tratada
            </button>
            <button type="button" aria-pressed={showingOriginal} onClick={() => setView("original")}>
              Foto original
            </button>
          </div>
        ) : null}

        <button type="button" className={`${styles.ctl} ${styles.close}`} onClick={close} aria-label="Fechar">
          <Icon name="close" size={24} />
        </button>
        {images.length > 1 ? (
          <>
            <button type="button" className={`${styles.ctl} ${styles.prev}`} onClick={() => go(-1)} aria-label="Foto anterior">
              <Icon name="left" size={26} />
            </button>
            <button type="button" className={`${styles.ctl} ${styles.next}`} onClick={() => go(1)} aria-label="Próxima foto">
              <Icon name="right" size={26} />
            </button>
          </>
        ) : null}
      </dialog>
    </>
  );
}
