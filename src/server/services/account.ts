import "server-only";
import { z } from "zod";
import { db } from "@/server/db";
import { hashPassword, verifyPassword } from "@/server/auth/session";
import { fail, success, zodFieldErrors, type ActionResult } from "@/server/result";

let dummyHash: string | null = null;

const emailSchema = z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(120);

/** Confere e-mail e senha. A mensagem de erro é sempre a mesma para não revelar se o e-mail existe. */
export async function authenticate(emailInput: unknown, password: unknown) {
  const email = emailSchema.safeParse(emailInput);
  if (!email.success || typeof password !== "string" || password.length === 0) return null;
  const user = await db.user.findUnique({ where: { email: email.data } });
  // Compara mesmo sem usuário, para o tempo de resposta não denunciar e-mails cadastrados.
  dummyHash ??= await hashPassword("atlas-dummy-password");
  const ok = await verifyPassword(password, user?.passwordHash ?? dummyHash);
  return ok && user ? user : null;
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe o seu nome.").max(80),
  email: emailSchema,
});

export async function updateProfile(userId: string, input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fail("Confira os campos destacados.", zodFieldErrors(parsed.error));
  const clash = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (clash && clash.id !== userId) return fail("Confira os campos destacados.", { email: "Este e-mail já está em uso." });
  await db.user.update({ where: { id: userId }, data: parsed.data });
  return success("Dados atualizados.");
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Informe a senha atual."),
    next: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres.").max(100),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { message: "As senhas não são iguais.", path: ["confirm"] });

export async function changePassword(userId: string, input: unknown): Promise<ActionResult<{ tokenVersion: number }>> {
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return fail("Confira os campos destacados.", zodFieldErrors(parsed.error));
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return fail("Usuário não encontrado.");
  if (!(await verifyPassword(parsed.data.current, user.passwordHash))) {
    return fail("Confira os campos destacados.", { current: "A senha atual está incorreta." });
  }
  // tokenVersion + 1 encerra as outras sessões abertas com a senha antiga.
  const updated = await db.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(parsed.data.next), tokenVersion: { increment: 1 } },
    select: { tokenVersion: true },
  });
  return success("Senha alterada.", { tokenVersion: updated.tokenVersion });
}
