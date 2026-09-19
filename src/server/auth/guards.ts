import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "./session";

/** Para páginas e Server Actions do painel: sem sessão válida, vai para o login. */
export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** Para rotas /api/admin: responde 401 (JSON) em vez de redirecionar. */
export async function requireAdminApi() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { admin: null, error: NextResponse.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 }) };
  }
  // Proteção extra contra CSRF: requisições que alteram dados precisam vir do próprio site.
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (origin && host) {
    let originHost = "";
    try {
      originHost = new URL(origin).host;
    } catch {}
    if (originHost !== host) {
      return { admin: null, error: NextResponse.json({ error: "Origem da requisição não permitida." }, { status: 403 }) };
    }
  }
  return { admin, error: null };
}
