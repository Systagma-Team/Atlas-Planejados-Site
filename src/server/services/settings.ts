import "server-only";
import { z } from "zod";
import { db } from "@/server/db";
import { fail, success, zodFieldErrors, type ActionResult } from "@/server/result";
import { onlyDigits } from "@/lib/format";

/**
 * Informações da empresa editáveis no painel. Nada disto é preenchido por padrão:
 * enquanto um campo estiver vazio, o site simplesmente não exibe aquele canal.
 */
export const SETTING_KEYS = [
  "whatsapp",
  "phone",
  "email",
  "instagram",
  "facebook",
  "address",
  "openingHours",
  "mapEmbedUrl",
  "aboutText",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];
export type SiteSettings = Record<SettingKey, string>;

const empty = (): SiteSettings => Object.fromEntries(SETTING_KEYS.map((k) => [k, ""])) as SiteSettings;

export async function getSettings(): Promise<SiteSettings> {
  const rows = await db.setting.findMany();
  const out = empty();
  for (const row of rows) if ((SETTING_KEYS as readonly string[]).includes(row.key)) out[row.key as SettingKey] = row.value;
  return out;
}

const optionalUrl = (hosts: string[], message: string) =>
  z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || hosts.some((h) => v.startsWith(h)), message);

const settingsSchema = z.object({
  whatsapp: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v === "" || (onlyDigits(v).length >= 10 && onlyDigits(v).length <= 13), "Informe o número com DDD. Ex.: (11) 91234-5678."),
  phone: z.string().trim().max(30),
  email: z
    .string()
    .trim()
    .max(120)
    .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Informe um e-mail válido."),
  instagram: optionalUrl(["https://www.instagram.com/", "https://instagram.com/"], "Cole o endereço completo do perfil. Ex.: https://www.instagram.com/seuperfil"),
  facebook: optionalUrl(["https://www.facebook.com/", "https://facebook.com/", "https://fb.com/"], "Cole o endereço completo da página do Facebook."),
  address: z.string().trim().max(300),
  openingHours: z.string().trim().max(200),
  mapEmbedUrl: optionalUrl(["https://www.google.com/maps/embed"], "Use o link de \"Incorporar um mapa\" do Google Maps (começa com https://www.google.com/maps/embed)."),
  aboutText: z.string().trim().max(3000),
});

export async function saveSettings(input: Record<string, unknown>): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail("Confira os campos destacados.", zodFieldErrors(parsed.error));
  await db.$transaction(
    SETTING_KEYS.map((key) =>
      db.setting.upsert({ where: { key }, create: { key, value: parsed.data[key] }, update: { value: parsed.data[key] } }),
    ),
  );
  return success("Informações salvas. O site já está atualizado.");
}
