"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type Base = { label: ReactNode; name: string; help?: ReactNode; error?: string };

function Wrap({ id, label, help, error, children }: { id: string; label: ReactNode; help?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <div className="adm-field">
      <label className="adm-label" htmlFor={id}>
        {label}
      </label>
      {children}
      {help ? (
        <p className="adm-help" id={`${id}-help`}>
          {help}
        </p>
      ) : null}
      {error ? (
        <p className="adm-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const describedBy = (id: string, help?: ReactNode, error?: string) => [help ? `${id}-help` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;

export function TextField({ label, name, help, error, ...rest }: Base & Omit<InputHTMLAttributes<HTMLInputElement>, "name">) {
  const id = `f-${name}`;
  return (
    <Wrap id={id} label={label} help={help} error={error}>
      <input id={id} name={name} className="adm-input" aria-invalid={!!error} aria-describedby={describedBy(id, help, error)} {...rest} />
    </Wrap>
  );
}

export function TextAreaField({ label, name, help, error, ...rest }: Base & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name">) {
  const id = `f-${name}`;
  return (
    <Wrap id={id} label={label} help={help} error={error}>
      <textarea id={id} name={name} className="adm-textarea" aria-invalid={!!error} aria-describedby={describedBy(id, help, error)} {...rest} />
    </Wrap>
  );
}

export function SelectField({ label, name, help, error, children, ...rest }: Base & Omit<SelectHTMLAttributes<HTMLSelectElement>, "name">) {
  const id = `f-${name}`;
  return (
    <Wrap id={id} label={label} help={help} error={error}>
      <select id={id} name={name} className="adm-select" aria-invalid={!!error} aria-describedby={describedBy(id, help, error)} {...rest}>
        {children}
      </select>
    </Wrap>
  );
}

export function CheckField({ name, title, description, ...rest }: { name: string; title: string; description?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "type" | "title">) {
  return (
    <label className="adm-check">
      <input type="checkbox" name={name} {...rest} />
      <div>
        <strong>{title}</strong>
        {description ? <span>{description}</span> : null}
      </div>
    </label>
  );
}

/** Botão principal de um formulário: mostra "Salvando…" enquanto envia. */
export function SubmitButton({
  children,
  pending,
  pendingLabel = "Salvando…",
  className = "adm-btn adm-btn--primary",
}: {
  children: ReactNode;
  pending: boolean;
  pendingLabel?: string;
  className?: string;
}) {
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
