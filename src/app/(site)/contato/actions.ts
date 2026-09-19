"use server";

import { headers } from "next/headers";
import { checkRateLimit } from "@/server/auth/rate-limit";
import { createLead } from "@/server/services/leads";
import { fail, success, type ActionResult } from "@/server/result";

export async function submitContact(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  // Campo-armadilha: pessoas não veem este campo, robôs costumam preenchê-lo.
  if (String(formData.get("website") ?? "").trim() !== "") return success("Recebemos sua mensagem. Entraremos em contato em breve.");

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const limit = await checkRateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) return fail("Você enviou várias mensagens seguidas. Tente novamente mais tarde.");

  return createLead({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    message: formData.get("message"),
  });
}
