"use server";

import { requireAdmin } from "@/server/auth/guards";
import { createSession } from "@/server/auth/session";
import { changePassword, updateProfile } from "@/server/services/account";
import type { ActionResult } from "@/server/result";

export async function updateProfileAction(fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  return updateProfile(admin.id, { name: fd.get("name"), email: fd.get("email") });
}

export async function changePasswordAction(fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const result = await changePassword(admin.id, {
    current: fd.get("current") ?? "",
    next: fd.get("next") ?? "",
    confirm: fd.get("confirm") ?? "",
  });
  if (!result.ok) return result;
  // Mantém esta sessão ativa com o novo número de versão; as demais são encerradas.
  await createSession({ id: admin.id, tokenVersion: result.data!.tokenVersion });
  return { ok: true, message: "Senha alterada. Outras sessões abertas foram encerradas." };
}
