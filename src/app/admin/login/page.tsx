import type { Metadata } from "next";
import { Logo } from "@/components/site/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="adm-login">
      <div className="adm-login-card">
        <Logo />
        <h1>Painel de gestão</h1>
        <p className="adm-sub">Entre para gerenciar projetos, categorias e informações do site.</p>
        <LoginForm />
      </div>
    </main>
  );
}
