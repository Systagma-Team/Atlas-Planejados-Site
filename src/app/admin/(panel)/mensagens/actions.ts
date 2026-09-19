"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/guards";
import { deleteLead, setLeadRead } from "@/server/services/leads";
import { fail, type ActionResult } from "@/server/result";

export async function setLeadReadAction(fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!id) return fail("Mensagem não informada.");
  const result = await setLeadRead(id, fd.get("read") === "true");
  revalidatePath("/admin", "layout");
  return result;
}

export async function deleteLeadAction(fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  if (!id) return fail("Mensagem não informada.");
  const result = await deleteLead(id);
  revalidatePath("/admin", "layout");
  return result;
}
