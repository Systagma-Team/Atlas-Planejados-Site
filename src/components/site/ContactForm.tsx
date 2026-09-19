"use client";

import { submitContact } from "@/app/(site)/contato/actions";
import { Icon } from "@/components/ui/Icon";
import { useActionForm } from "@/lib/useActionForm";
import styles from "./ContactForm.module.css";

export function ContactForm({ defaultMessage = "" }: { defaultMessage?: string }) {
  const { state, pending, onSubmit, fieldErrors: errors } = useActionForm((fd) => submitContact(null, fd));

  if (state?.ok) {
    return (
      <div className={styles.done} role="status">
        <span className={styles.doneIcon}>
          <Icon name="check" size={28} />
        </span>
        <h2 className={styles.doneTitle}>Mensagem enviada</h2>
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      {state && !state.ok && !state.fieldErrors ? (
        <p className={styles.alert} role="alert">
          {state.message}
        </p>
      ) : null}

      <div className={styles.field}>
        <label htmlFor="name">Nome</label>
        <input id="name" name="name" type="text" autoComplete="name" required aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
        {errors.name ? <p id="name-error" className={styles.error}>{errors.name}</p> : null}
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="phone">Telefone / WhatsApp</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-error" : undefined} />
          {errors.phone ? <p id="phone-error" className={styles.error}>{errors.phone}</p> : null}
        </div>
        <div className={styles.field}>
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />
          {errors.email ? <p id="email-error" className={styles.error}>{errors.email}</p> : null}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="message">Conte-nos sobre o seu projeto</label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          defaultValue={defaultMessage}
          placeholder="Ex.: cozinha de 3 metros, quero armários até o teto…"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {errors.message ? <p id="message-error" className={styles.error}>{errors.message}</p> : null}
      </div>

      {/* Armadilha para robôs: escondido de pessoas e de leitores de tela. */}
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor="website">Não preencha este campo</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "Enviando…" : "Enviar mensagem"}
        {!pending ? <Icon name="arrow" size={18} /> : null}
      </button>
      <p className={styles.hint}>Informe um telefone ou e-mail para retornarmos o contato.</p>
    </form>
  );
}
