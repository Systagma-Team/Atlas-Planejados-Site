import "server-only";
import { z } from "zod";
import { db } from "@/server/db";
import { fail, success, zodFieldErrors, type ActionResult } from "@/server/result";

const leadSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome.").max(100),
    phone: z.string().trim().max(30).default(""),
    email: z
      .string()
      .trim()
      .max(120)
      .default("")
      .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Informe um e-mail válido."),
    message: z.string().trim().min(10, "Conte um pouco sobre o que você precisa.").max(3000, "Mensagem longa demais."),
  })
  .refine((v) => v.phone !== "" || v.email !== "", { message: "Informe um telefone ou e-mail para retornarmos.", path: ["phone"] });

export async function createLead(input: unknown): Promise<ActionResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return fail("Confira os campos destacados.", zodFieldErrors(parsed.error));
  await db.lead.create({ data: parsed.data });
  return success("Recebemos sua mensagem. Entraremos em contato em breve.");
}

export async function listLeads() {
  return db.lead.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
}

export async function countUnreadLeads() {
  return db.lead.count({ where: { readAt: null } });
}

export async function setLeadRead(id: string, read: boolean): Promise<ActionResult> {
  try {
    await db.lead.update({ where: { id }, data: { readAt: read ? new Date() : null } });
  } catch {
    return fail("Mensagem não encontrada.");
  }
  return success();
}

export async function deleteLead(id: string): Promise<ActionResult> {
  await db.lead.deleteMany({ where: { id } });
  return success("Mensagem excluída.");
}
