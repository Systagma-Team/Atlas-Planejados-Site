import type { Metadata } from "next";
import { getSettings } from "@/server/services/settings";
import { SettingsForm } from "./SettingsForm";
import { saveSettingsAction } from "./actions";

export const metadata: Metadata = { title: "Informações do site" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Informações do site</h1>
          <p className="adm-sub">Contatos, redes sociais e o texto da página “Sobre”. As mudanças aparecem no site assim que você salvar.</p>
        </div>
      </div>
      <SettingsForm settings={settings} action={saveSettingsAction} />
    </>
  );
}
