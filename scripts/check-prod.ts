/**
 * Confere se o ambiente de produção (.env.supabase) está completo e acessível — sem mostrar nenhum segredo.
 *   npm run prod:check
 */
import { PrismaClient } from "@prisma/client";

const required = ["DATABASE_URL", "DIRECT_URL", "STORAGE_DRIVER", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_STORAGE_BUCKET", "NEXT_PUBLIC_MEDIA_BASE_URL", "AUTH_SECRET"];

async function main() {
  const problems: string[] = [];
  for (const key of required) {
    const v = process.env[key];
    if (!v) problems.push(`${key} ausente`);
    else if (v.includes(">>> PREENCHER <<<") || v.includes("[SENHA]") || v.includes("[YOUR-PASSWORD]")) problems.push(`${key} ainda não foi preenchido`);
  }
  if (process.env.STORAGE_DRIVER !== "supabase") problems.push('STORAGE_DRIVER deveria ser "supabase"');
  if (process.env.DATABASE_URL && !/:6543\//.test(process.env.DATABASE_URL)) problems.push("DATABASE_URL não parece o Transaction pooler (porta 6543)");
  if (process.env.DATABASE_URL && !/pgbouncer=true/.test(process.env.DATABASE_URL)) problems.push("DATABASE_URL precisa de ?pgbouncer=true&connection_limit=5");
  if (process.env.DATABASE_URL?.includes("localhost")) problems.push("DATABASE_URL aponta para localhost (não é o Supabase)");
  if (problems.length) {
    console.log("✗ Ambiente incompleto:\n  - " + problems.join("\n  - "));
    process.exit(1);
  }

  const host = (u: string) => new URL(u).host;
  console.log(`• Banco (site):     ${host(process.env.DATABASE_URL!)}`);
  console.log(`• Banco (migração): ${host(process.env.DIRECT_URL!)}`);
  console.log(`• Storage:          ${process.env.SUPABASE_URL} / bucket "${process.env.SUPABASE_STORAGE_BUCKET}"`);

  const db = new PrismaClient();
  try {
    await db.$queryRaw`SELECT 1`;
    console.log("✓ Conexão com o banco OK (pooler)");
  } catch (e) {
    console.log("✗ Não conectou ao banco:", (e as Error).message.split("\n").slice(-2).join(" ").slice(0, 200));
    process.exit(1);
  } finally {
    await db.$disconnect();
  }

  // Storage: testa a chave enviando e apagando um arquivo minúsculo.
  const { getStorage } = await import("../src/server/images/drivers");
  const storage = getStorage();
  const probe = `healthcheck/${Date.now()}.webp`;
  const tinyWebp = Buffer.from("UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==", "base64");
  try {
    await storage.put(probe, tinyWebp, "image/webp");
    await storage.removeFolder("healthcheck");
    console.log("✓ Storage OK (gravou e apagou um arquivo de teste)");
  } catch (e) {
    console.log("✗ Storage falhou:", (e as Error).message.slice(0, 200));
    process.exit(1);
  }
  console.log("Tudo pronto para: npm run prod:migrate");
}

main();
