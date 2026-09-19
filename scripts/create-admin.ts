/**
 * Cria um administrador ou redefine a senha de um existente.
 *   npm run admin:create -- email@exemplo.com "nova senha"
 * (sem argumentos usa ADMIN_EMAIL / ADMIN_PASSWORD do .env)
 */
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

try {
  process.loadEnvFile(path.resolve(process.cwd(), ".env"));
} catch {}

const db = new PrismaClient();

async function main() {
  const email = (process.argv[2] || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.argv[3] || process.env.ADMIN_PASSWORD || "";
  if (!email || password.length < 8) {
    console.error("Uso: npm run admin:create -- email@exemplo.com \"senha com 8+ caracteres\"");
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { email },
    create: { email, name: "Administrador", passwordHash },
    // tokenVersion + 1 encerra sessões antigas ao redefinir a senha.
    update: { passwordHash, tokenVersion: { increment: 1 } },
  });
  console.log(`✓ Administrador pronto: ${user.email}`);
}

main().finally(() => db.$disconnect());
