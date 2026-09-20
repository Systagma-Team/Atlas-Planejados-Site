"use client";

import { SubmitButton, TextAreaField, TextField } from "@/components/admin/Fields";
import { useResultToast } from "@/components/admin/Toast";
import { useActionForm } from "@/lib/useActionForm";
import type { ActionResult } from "@/server/result";
import type { SiteSettings } from "@/server/services/settings";

export function SettingsForm({ settings, action }: { settings: SiteSettings; action: (fd: FormData) => Promise<ActionResult> }) {
  const { state, pending, onSubmit, fieldErrors: e } = useActionForm(action);
  useResultToast(state);

  return (
    <form onSubmit={onSubmit} className="adm-form" noValidate>
      {state && !state.ok && Object.keys(e).length === 0 ? (
        <p className="adm-alert" role="alert">
          {state.message}
        </p>
      ) : null}

      <section className="adm-card" aria-labelledby="contato">
        <div className="adm-card-head">
          <div>
            <h2 id="contato">Contato</h2>
            <p className="adm-sub">Só aparece no site o que você preencher. Campos vazios ficam escondidos.</p>
          </div>
        </div>
        <div className="adm-form">
          <div className="adm-row adm-row--2">
            <TextField label="WhatsApp principal" name="whatsapp" defaultValue={settings.whatsapp} error={e.whatsapp} inputMode="tel" placeholder="+55 84 99999-9999" help="Com DDD. Os botões de WhatsApp aparecem no site quando este campo está preenchido." />
            <TextField label={<>WhatsApp secundário <small>(opcional)</small></>} name="whatsapp2" defaultValue={settings.whatsapp2} error={e.whatsapp2} inputMode="tel" placeholder="+55 84 99999-9999" help="Se preenchido, o botão flutuante do site oferece os dois números." />
          </div>
          <div className="adm-row adm-row--2">
            <TextField label="Telefone" name="phone" defaultValue={settings.phone} error={e.phone} inputMode="tel" placeholder="(84) 3456-7890" />
            <TextField label="E-mail" name="email" type="email" defaultValue={settings.email} error={e.email} placeholder="contato@seudominio.com.br" />
          </div>
          <TextField label="Endereço" name="address" defaultValue={settings.address} error={e.address} placeholder="Rua, número, bairro, cidade" />
          <TextField label="Horário de atendimento" name="openingHours" defaultValue={settings.openingHours} error={e.openingHours} placeholder="Ex.: Segunda a sexta, 8h às 18h" />
        </div>
      </section>

      <section className="adm-card" aria-labelledby="redes">
        <div className="adm-card-head">
          <h2 id="redes">Redes sociais e mapa</h2>
        </div>
        <div className="adm-form">
          <div className="adm-row adm-row--2">
            <TextField label="Instagram" name="instagram" defaultValue={settings.instagram} error={e.instagram} placeholder="https://www.instagram.com/seuperfil" help="Cole o endereço completo do perfil." />
            <TextField label="Facebook" name="facebook" defaultValue={settings.facebook} error={e.facebook} placeholder="https://www.facebook.com/suapagina" />
          </div>
          <TextField
            label="Mapa (Google Maps)"
            name="mapEmbedUrl"
            defaultValue={settings.mapEmbedUrl}
            error={e.mapEmbedUrl}
            placeholder="https://www.google.com/maps/embed?pb=…"
            help={
              <>
                No Google Maps: busque o endereço → <strong>Compartilhar</strong> → <strong>Incorporar um mapa</strong> → copie apenas o endereço que aparece depois de <code>src=&quot;</code>.
              </>
            }
          />
        </div>
      </section>

      <section className="adm-card" aria-labelledby="sobre">
        <div className="adm-card-head">
          <h2 id="sobre">Texto da página “Sobre”</h2>
        </div>
        <TextAreaField
          label="Nossa trajetória"
          name="aboutText"
          defaultValue={settings.aboutText}
          error={e.aboutText}
          rows={8}
          help="Conte a história e a experiência da Atlas. Deixe uma linha em branco entre os parágrafos. Enquanto este campo estiver vazio, o site mostra um aviso de “conteúdo provisório”."
        />
      </section>

      <div className="adm-form-actions">
        <SubmitButton pending={pending}>Salvar informações</SubmitButton>
      </div>
    </form>
  );
}
