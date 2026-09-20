"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/Toast";
import { mediaThumb } from "@/lib/media";
import { prepareForUpload } from "@/lib/prepareUpload";

export type GalleryImage = {
  id: string;
  fileKey: string;
  alt: string;
  width: number;
  height: number;
  blurDataUrl: string;
  originalFileKey: string | null;
  originalWidth: number | null;
  originalHeight: number | null;
};
type Pending = { tempId: string; name: string; preview: string; error?: string };

const MAX_BYTES = 15 * 1024 * 1024;
// Uma foto por requisição: cada envio fica bem abaixo do limite de tamanho das funções serverless.
const CHUNK = 1;

async function api<T>(url: string, init: RequestInit): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  try {
    const res = await fetch(url, init);
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) return { ok: false, message: "Sua sessão expirou. Atualize a página e entre novamente." };
    if (!res.ok) return { ok: false, message: data.error ?? "Não foi possível concluir a ação." };
    return { ok: true, data };
  } catch {
    return { ok: false, message: "Sem conexão com o servidor. Verifique a internet e tente de novo." };
  }
}

export function ImageManager({ projectId, initialImages, initialCoverId }: { projectId: string; initialImages: GalleryImage[]; initialCoverId: string | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [images, setImages] = useState(initialImages);
  const [coverId, setCoverId] = useState(initialCoverId);
  const [pending, setPending] = useState<Pending[]>([]);
  const [over, setOver] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<GalleryImage | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [originalBusy, setOriginalBusy] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const base = `/api/admin/projects/${projectId}/images`;

  /* ------------------------------ Envio ------------------------------ */
  async function upload(list: FileList | File[]) {
    const files = Array.from(list).filter((f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|avif|heic)$/i.test(f.name));
    if (files.length === 0) {
      toast("Escolha arquivos de imagem (JPG, PNG ou WebP).", "error");
      return;
    }

    const tiles: Pending[] = files.map((f, i) => ({
      tempId: `${Date.now()}-${i}`,
      name: f.name,
      preview: URL.createObjectURL(f),
      error: f.size > MAX_BYTES ? "A foto é muito grande (limite de 15 MB)." : undefined,
    }));
    setPending((p) => [...p, ...tiles]);

    let added = 0;
    for (let i = 0; i < files.length; i += CHUNK) {
      const slice = tiles.slice(i, i + CHUNK).map((t, k) => ({ tile: t, file: files[i + k] })).filter((x) => !x.tile.error);
      if (slice.length === 0) continue;

      const body = new FormData();
      for (const x of slice) body.append("files", await prepareForUpload(x.file));
      const res = await api<{ images: GalleryImage[]; coverImageId: string | null; errors: { name: string; message: string }[] }>(base, { method: "POST", body });

      const sliceIds = new Set(slice.map((x) => x.tile.tempId));
      if (!res.ok) {
        setPending((p) => p.map((t) => (sliceIds.has(t.tempId) ? { ...t, error: res.message } : t)));
        toast(res.message, "error");
        continue;
      }
      const failed = new Map(res.data.errors.map((e) => [e.name, e.message]));
      setImages((list) => [...list, ...res.data.images]);
      setCoverId(res.data.coverImageId);
      added += res.data.images.length;
      setPending((p) =>
        p.flatMap((t) => {
          if (!sliceIds.has(t.tempId)) return [t];
          const message = failed.get(t.name);
          if (message) return [{ ...t, error: message }];
          URL.revokeObjectURL(t.preview);
          return [];
        }),
      );
      res.data.errors.forEach((e) => toast(`${e.name}: ${e.message}`, "error"));
    }
    if (added > 0) {
      toast(added === 1 ? "Foto adicionada." : `${added} fotos adicionadas.`);
      router.refresh();
    }
  }

  const dismissPending = (tempId: string) =>
    setPending((p) => {
      const tile = p.find((t) => t.tempId === tempId);
      if (tile) URL.revokeObjectURL(tile.preview);
      return p.filter((t) => t.tempId !== tempId);
    });

  /* ---------------------------- Reordenar ---------------------------- */
  async function persistOrder(next: GalleryImage[], previous: GalleryImage[]) {
    setImages(next);
    const res = await api(`${base}/reorder`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: next.map((i) => i.id) }) });
    if (!res.ok) {
      setImages(previous);
      toast(res.message, "error");
    } else {
      toast("Ordem das fotos salva.");
    }
  }

  function move(id: string, to: number) {
    const from = images.findIndex((i) => i.id === id);
    if (from < 0 || to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    void persistOrder(next, images);
  }

  /* ------------------------------ Capa/alt ----------------------------- */
  async function makeCover(id: string) {
    const previous = coverId;
    setCoverId(id);
    const res = await api(`${base}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cover: true }) });
    if (!res.ok) {
      setCoverId(previous);
      toast(res.message, "error");
    } else toast("Capa atualizada.");
  }

  async function saveAlt(image: GalleryImage, value: string) {
    if (value.trim() === image.alt) return;
    const res = await api(`${base}/${image.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alt: value }) });
    if (!res.ok) toast(res.message, "error");
    else {
      setImages((list) => list.map((i) => (i.id === image.id ? { ...i, alt: value.trim() } : i)));
      toast("Descrição da foto salva.");
    }
  }

  /* --------------------- Foto original (sem tratamento) --------------------- */
  async function uploadOriginal(image: GalleryImage, file: File) {
    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|avif)$/i.test(file.name)) {
      toast("Escolha um arquivo de imagem (JPG, PNG ou WebP).", "error");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast("A foto é muito grande (limite de 15 MB).", "error");
      return;
    }
    setOriginalBusy(image.id);
    const body = new FormData();
    body.append("file", await prepareForUpload(file));
    const res = await api<{ originalFileKey: string; originalWidth: number; originalHeight: number }>(`${base}/${image.id}/original`, { method: "POST", body });
    setOriginalBusy(null);
    if (!res.ok) {
      toast(res.message, "error");
      return;
    }
    setImages((list) => list.map((i) => (i.id === image.id ? { ...i, ...res.data } : i)));
    toast("Foto original ligada a esta imagem.");
  }

  async function removeOriginal(image: GalleryImage) {
    setOriginalBusy(image.id);
    const res = await api(`${base}/${image.id}/original`, { method: "DELETE" });
    setOriginalBusy(null);
    if (!res.ok) {
      toast(res.message, "error");
      return;
    }
    setImages((list) => list.map((i) => (i.id === image.id ? { ...i, originalFileKey: null, originalWidth: null, originalHeight: null } : i)));
    toast("Foto original removida.");
  }

  /* ------------------------------ Remover ------------------------------ */
  async function confirmRemove() {
    if (!removing) return;
    setRemoveBusy(true);
    const res = await api<{ message?: string; coverImageId: string | null }>(`${base}/${removing.id}`, { method: "DELETE" });
    setRemoveBusy(false);
    if (!res.ok) {
      toast(res.message, "error");
      return;
    }
    setImages((list) => list.filter((i) => i.id !== removing.id));
    setCoverId(res.data.coverImageId);
    setRemoving(null);
    toast(res.data.message ?? "Foto removida.");
    router.refresh();
  }

  return (
    <div>
      <div
        className="adm-drop"
        data-over={over}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setOver(true);
          }
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          setOver(false);
          void upload(e.dataTransfer.files);
        }}
      >
        <Icon name="upload" size={28} />
        <p>
          <strong>Arraste as fotos até aqui</strong> ou escolha do seu computador ou celular
        </p>
        <p className="adm-help">JPG, PNG ou WebP · até 15 MB cada · você pode enviar várias de uma vez</p>
        <button type="button" className="adm-btn adm-btn--primary" onClick={() => inputRef.current?.click()}>
          <Icon name="plus" size={18} /> Adicionar fotos
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          aria-label="Escolher fotos do projeto"
          onChange={(e) => {
            if (e.target.files?.length) void upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {images.length === 0 && pending.length === 0 ? <p className="adm-help" style={{ marginTop: 16 }}>Este projeto ainda não tem fotos. Adicione pelo menos uma para poder publicá-lo.</p> : null}

      {images.length > 0 || pending.length > 0 ? (
        <>
          {images.length > 1 ? <p className="adm-help" style={{ marginTop: 16 }}>Arraste as fotos para mudar a ordem (ou use as setas). A primeira aparece primeiro na página do projeto.</p> : null}
          <ul className="adm-gallery" aria-label="Fotos do projeto">
            {images.map((image, index) => (
              <li
                key={image.id}
                className="adm-tile"
                data-dragging={dragId === image.id}
                data-target={targetId === image.id && dragId !== image.id}
                onDragOver={(e) => {
                  if (dragId) {
                    e.preventDefault();
                    setTargetId(image.id);
                  }
                }}
                onDrop={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  move(dragId, index);
                  setDragId(null);
                  setTargetId(null);
                }}
              >
                <div
                  className="adm-tile-img"
                  draggable
                  onDragStart={(e) => {
                    setDragId(image.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setTargetId(null);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaThumb(image)} alt={image.alt || `Foto ${index + 1} do projeto`} width={image.width} height={image.height} draggable={false} />
                  {coverId === image.id ? (
                    <span className="adm-tile-flag">
                      <Icon name="star" size={13} /> Capa
                    </span>
                  ) : null}
                </div>

                <label className="adm-help" htmlFor={`alt-${image.id}`} style={{ fontSize: "0.8125rem" }}>
                  Descrição da foto <span>(para quem não enxerga a imagem)</span>
                </label>
                <input
                  id={`alt-${image.id}`}
                  className="adm-input"
                  style={{ minHeight: 40, padding: "8px 12px", fontSize: "0.9375rem" }}
                  defaultValue={image.alt}
                  maxLength={200}
                  placeholder="Ex.: Cozinha com armários cinza"
                  onBlur={(e) => void saveAlt(image, e.currentTarget.value)}
                />

                <div className="adm-orig">
                  <span className="adm-help" style={{ fontSize: "0.8125rem" }}>
                    Foto original <span>(sem tratamento; o visitante escolhe se quer ver)</span>
                  </span>
                  {image.originalFileKey && image.originalWidth ? (
                    <div className="adm-orig-row">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mediaThumb({ fileKey: image.originalFileKey, width: image.originalWidth })} alt={`Foto original da foto ${index + 1}`} width={56} height={42} />
                      <label className="adm-btn adm-btn--sm" style={{ cursor: originalBusy === image.id ? "wait" : "pointer" }}>
                        {originalBusy === image.id ? "Enviando…" : "Trocar"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          hidden
                          disabled={originalBusy === image.id}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = "";
                            if (f) void uploadOriginal(image, f);
                          }}
                        />
                      </label>
                      <button type="button" className="adm-btn adm-btn--sm" onClick={() => removeOriginal(image)} disabled={originalBusy === image.id}>
                        Remover
                      </button>
                    </div>
                  ) : (
                    <label className="adm-btn adm-btn--sm" style={{ cursor: originalBusy === image.id ? "wait" : "pointer" }}>
                      <Icon name="plus" size={16} /> {originalBusy === image.id ? "Enviando…" : "Adicionar foto original"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        hidden
                        disabled={originalBusy === image.id}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (f) void uploadOriginal(image, f);
                        }}
                      />
                    </label>
                  )}
                </div>

                <div className="adm-tile-tools">
                  <button type="button" className="adm-btn adm-btn--sm" onClick={() => makeCover(image.id)} disabled={coverId === image.id}>
                    {coverId === image.id ? "É a capa" : "Usar como capa"}
                  </button>
                  <button type="button" className="adm-icon-btn" onClick={() => move(image.id, index - 1)} disabled={index === 0} aria-label={`Mover foto ${index + 1} para antes`}>
                    <Icon name="left" size={18} />
                  </button>
                  <button type="button" className="adm-icon-btn" onClick={() => move(image.id, index + 1)} disabled={index === images.length - 1} aria-label={`Mover foto ${index + 1} para depois`}>
                    <Icon name="right" size={18} />
                  </button>
                  <button type="button" className="adm-icon-btn" onClick={() => setRemoving(image)} aria-label={`Remover foto ${index + 1}`} style={{ color: "var(--adm-danger)" }}>
                    <Icon name="trash" size={18} />
                  </button>
                </div>
              </li>
            ))}

            {pending.map((tile) => (
              <li key={tile.tempId} className="adm-tile">
                <div className="adm-tile-img" style={{ cursor: "default" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tile.preview} alt="" />
                  {!tile.error ? <span className="adm-tile-busy">Enviando…</span> : null}
                </div>
                <p className="adm-help" style={{ overflowWrap: "anywhere" }}>{tile.name}</p>
                {tile.error ? (
                  <>
                    <p className="adm-tile-err" role="alert">{tile.error}</p>
                    <button type="button" className="adm-btn adm-btn--sm" onClick={() => dismissPending(tile.tempId)}>
                      Dispensar
                    </button>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <ConfirmDialog
        open={removing !== null}
        pending={removeBusy}
        danger
        title="Remover esta foto?"
        message="A foto será apagada deste projeto e deixará de aparecer no site. Esta ação não pode ser desfeita."
        confirmLabel="Sim, remover foto"
        onClose={() => !removeBusy && setRemoving(null)}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
