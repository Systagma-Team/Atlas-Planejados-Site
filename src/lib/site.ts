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
