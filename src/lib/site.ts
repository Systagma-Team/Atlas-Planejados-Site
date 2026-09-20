export const SITE_NAME = "Atlas Planejados";

export function siteUrl() {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export const SITE_DESCRIPTION =
  "Móveis planejados sob medida: cozinhas, mobiliário comercial e projetos personalizados, com atenção ao acabamento e aos detalhes.";

/** Monta o link do WhatsApp a partir do número cadastrado no painel (com DDD; DDI 55 é assumido). */
export function whatsappLink(number: string, text?: string) {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const full = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function telLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `tel:+${digits.length <= 11 ? "55" : ""}${digits}` : null;
}

export type WhatsappOption = { key: "whatsapp" | "whatsapp2"; label: string; number: string; href: string };

/**
 * Números de WhatsApp cadastrados no painel (principal e, opcionalmente, secundário), já com o link pronto.
 * Com um único número o rótulo é "WhatsApp"; com dois, "Principal" e "Secundário".
 */
export function whatsappOptions(settings: { whatsapp?: string; whatsapp2?: string }, text?: string): WhatsappOption[] {
  const raw = [
    { key: "whatsapp" as const, number: settings.whatsapp ?? "" },
    { key: "whatsapp2" as const, number: settings.whatsapp2 ?? "" },
  ].filter((o) => o.number.trim() !== "");
  const options = raw
    .map((o) => ({ ...o, href: whatsappLink(o.number, text) }))
    .filter((o): o is typeof o & { href: string } => o.href !== null);
  return options.map((o) => ({
    key: o.key,
    number: o.number,
    href: o.href,
    label: options.length === 1 ? "WhatsApp" : o.key === "whatsapp" ? "Principal" : "Secundário",
  }));
}
