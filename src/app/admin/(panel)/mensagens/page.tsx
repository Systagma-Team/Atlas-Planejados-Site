import type { Metadata } from "next";
import { listLeads } from "@/server/services/leads";
import { ActionForm, ActionSubmit } from "@/components/admin/ActionForm";
import { Icon } from "@/components/ui/Icon";
import { formatDateTime } from "@/lib/format";
import { telLink, whatsappLink } from "@/lib/site";
import { deleteLeadAction, setLeadReadAction } from "./actions";

export const metadata: Metadata = { title: "Mensagens" };

export default async function MessagesPage() {
  const leads = await listLeads();

  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Mensagens</h1>
          <p className="adm-sub">Pedidos de orçamento enviados pelo formulário do site, do mais recente para o mais antigo.</p>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="adm-card">
          <div className="adm-empty">
            <h2>Nenhuma mensagem ainda</h2>
            <p>Quando alguém preencher o formulário de orçamento do site, a mensagem aparece aqui.</p>
          </div>
        </div>
      ) : (
        <ul className="adm-list" aria-label="Mensagens recebidas">
          {leads.map((lead) => {
            const wa = lead.phone ? whatsappLink(lead.phone, `Olá, ${lead.name}! Aqui é da Atlas Planejados, recebemos o seu pedido de orçamento.`) : null;
            const tel = lead.phone ? telLink(lead.phone) : null;
            return (
              <li key={lead.id} className="adm-msg" data-unread={!lead.readAt}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", alignItems: "baseline", justifyContent: "space-between" }}>
                  <strong style={{ fontSize: "1.0625rem" }}>
                    {lead.name}{" "}
                    {!lead.readAt ? <span className="adm-badge adm-badge--draft">Nova</span> : null}
                  </strong>
                  <span className="adm-help">{formatDateTime(lead.createdAt)}</span>
                </div>
                <div className="adm-meta" style={{ marginTop: 0 }}>
                  {lead.phone ? <span>Tel.: {lead.phone}</span> : null}
                  {lead.email ? <span>E-mail: {lead.email}</span> : null}
                </div>
                <p>{lead.message}</p>
                <div className="adm-actions">
                  {wa ? (
                    <a className="adm-btn adm-btn--sm" href={wa} target="_blank" rel="noopener noreferrer">
                      <Icon name="whatsapp" size={16} /> Responder no WhatsApp
                    </a>
                  ) : null}
                  {tel ? (
                    <a className="adm-btn adm-btn--sm" href={tel}>
                      <Icon name="phone" size={16} /> Ligar
                    </a>
                  ) : null}
                  {lead.email ? (
                    <a className="adm-btn adm-btn--sm" href={`mailto:${lead.email}`}>
                      <Icon name="mail" size={16} /> Responder por e-mail
                    </a>
                  ) : null}
                  <ActionForm action={setLeadReadAction} fields={{ id: lead.id, read: String(!lead.readAt) }}>
                    <ActionSubmit className="adm-btn adm-btn--sm">{lead.readAt ? "Marcar como não lida" : "Marcar como lida"}</ActionSubmit>
                  </ActionForm>
                  <ActionForm
                    action={deleteLeadAction}
                    fields={{ id: lead.id }}
                    confirm={{ title: "Excluir esta mensagem?", message: `A mensagem de ${lead.name} será apagada de forma definitiva.`, confirmLabel: "Sim, excluir", danger: true }}
                  >
                    <ActionSubmit className="adm-btn adm-btn--sm adm-btn--danger">
                      <Icon name="trash" size={16} /> Excluir
                    </ActionSubmit>
                  </ActionForm>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
