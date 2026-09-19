"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import type { ActionResult } from "@/server/result";

type Toast = { id: number; message: string; type: "success" | "error" };
type Ctx = { toast: (message: string, type?: Toast["type"]) => void };

const ToastContext = createContext<Ctx>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const counter = useRef(0);

  const toast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = ++counter.current;
    setItems((list) => [...list, { id, message, type }]);
    // Erros ficam mais tempo na tela.
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), type === "error" ? 8000 : 4500);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="adm-toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`adm-toast ${t.type === "error" ? "adm-toast--error" : ""}`}>
            <Icon name={t.type === "error" ? "close" : "check"} size={18} style={{ marginTop: 3, flex: "none" }} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Mostra o resultado de uma ação (useActionState) como aviso na tela. */
export function useResultToast(state: ActionResult<unknown> | null) {
  const { toast } = useToast();
  const last = useRef<ActionResult<unknown> | null>(null);
  useEffect(() => {
    if (!state || state === last.current) return;
    last.current = state;
    if (state.message) toast(state.message, state.ok ? "success" : "error");
  }, [state, toast]);
}

/** Aviso vindo de um redirecionamento (?ok=...): aparece uma vez e limpa o endereço. */
export function FlashToast({ message, param }: { message?: string; param: string }) {
  const { toast } = useToast();
  useEffect(() => {
    if (!message) return;
    toast(message);
    const url = new URL(window.location.href);
    url.searchParams.delete(param);
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [message, param, toast]);
  return null;
}
