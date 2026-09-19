import "server-only";
import { db } from "@/server/db";

/**
 * Limitador de tentativas guardado no banco (tabela RateLimit). Em hospedagem serverless cada execução
 * pode rodar em uma instância diferente, então um contador em memória não funcionaria.
 * O incremento é atômico (INSERT ... ON CONFLICT), então tentativas simultâneas são contadas corretamente.
 */
export async function checkRateLimit(key: string, max: number, windowMs: number) {
  const resetAt = new Date(Date.now() + windowMs);
  try {
    const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT ("key") DO UPDATE SET
        "count"   = CASE WHEN "RateLimit"."resetAt" < now() THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" < now() THEN ${resetAt} ELSE "RateLimit"."resetAt" END
      RETURNING "count", "resetAt"`;
    const row = rows[0];

    // Limpeza ocasional de contadores vencidos (1 em cada 50 chamadas).
    if (Math.random() < 0.02) {
      void db.rateLimit.deleteMany({ where: { resetAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }).catch(() => {});
    }

    if (row.count > max) {
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((new Date(row.resetAt).getTime() - Date.now()) / 1000)) };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  } catch {
    // Se o banco falhar, não bloqueia visitantes legítimos por causa do limitador.
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

export async function resetRateLimit(key: string) {
  await db.rateLimit.deleteMany({ where: { key } }).catch(() => {});
}
