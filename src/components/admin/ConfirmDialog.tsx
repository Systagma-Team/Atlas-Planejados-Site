"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/** Confirmação explícita antes de ações que apagam ou escondem conteúdo. O foco começa em "Cancelar". */
export function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel = "Cancelar", danger, pending, onConfirm, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="adm-dialog" aria-labelledby="confirm-title" onClose={onClose} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="adm-dialog-body">
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
      </div>
      <div className="adm-dialog-actions">
        <button ref={cancelRef} type="button" className="adm-btn" onClick={onClose} disabled={pending}>
          {cancelLabel}
        </button>
        <button type="button" className={`adm-btn ${danger ? "adm-btn--danger-solid" : "adm-btn--primary"}`} onClick={onConfirm} disabled={pending}>
          {pending ? "Aguarde…" : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
