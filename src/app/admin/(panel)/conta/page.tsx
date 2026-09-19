import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth/guards";
import { ProfileForm, PasswordForm } from "./AccountForms";
import { changePasswordAction, updateProfileAction } from "./actions";

export const metadata: Metadata = { title: "Minha conta" };

export default async function AccountPage() {
  const admin = await requireAdmin();
  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>Minha conta</h1>
          <p className="adm-sub">Seus dados de acesso ao painel.</p>
        </div>
      </div>

      <section className="adm-card" aria-labelledby="dados">
        <div className="adm-card-head">
          <h2 id="dados">Dados de acesso</h2>
        </div>
        <ProfileForm name={admin.name} email={admin.email} action={updateProfileAction} />
      </section>

      <section className="adm-card" aria-labelledby="senha">
        <div className="adm-card-head">
          <h2 id="senha">Trocar senha</h2>
        </div>
        <PasswordForm action={changePasswordAction} />
      </section>
    </>
  );
}
