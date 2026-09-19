"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkRateLimit, resetRateLimit } from "@/server/auth/rate-limit";
import { createSession, destroySession } from "@/server/auth/session";
import { authenticate } from "@/server/services/account";
import { fail, type ActionResult } from "@/server/result";

const GENERIC_ERROR = "E-mail ou senha incorretos. Confira e tente de novo.";

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const key = `login:${ip}:${email}`;

  // 5 tentativas a cada 15 minutos por IP + e-mail.
  const limit = await checkRateLimit(key, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    const minutes = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60));
    return fail(`Muitas tentativas. Aguarde ${minutes} minuto(s) e tente novamente.`);
  }

  const user = await authenticate(email, formData.get("password"));
  if (!user) return fail(GENERIC_ERROR);

  await resetRateLimit(key);
  await createSession(user);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}
