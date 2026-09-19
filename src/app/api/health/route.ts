import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { checkRateLimit } from "@/server/auth/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Verificação de saúde e "ping" para manter o banco ativo (projetos gratuitos do Supabase são pausados
 * após alguns dias sem atividade). Faz uma leitura real no banco e não expõe nenhum dado.
 * Um agendador externo deve chamar este endereço 1–2 vezes por dia (veja .github/workflows/keep-alive.yml).
 */
export async function GET(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (!(await checkRateLimit(`health:${ip}`, 30, 60 * 1000)).allowed) {
    return NextResponse.json({ ok: false }, { status: 429, headers: { "Cache-Control": "no-store" } });
  }

  try {
    await db.$queryRaw`SELECT 1`;
    await db.category.count(); // leitura em tabela real, para contar como atividade do banco
    return NextResponse.json({ ok: true, at: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Sem detalhes do erro na resposta pública; o agendador só precisa do status HTTP.
    return NextResponse.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
