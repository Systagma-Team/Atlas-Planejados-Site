// Assinatura/verificação do token de sessão. Sem dependências de Node/Prisma:
// pode ser usado também no proxy (edge).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "atlas_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 dias

export type SessionPayload = { userId: string; tokenVersion: number };

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET ausente ou curta demais (mínimo 32 caracteres). Verifique o arquivo .env.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ tv: payload.tokenVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (!payload.sub || typeof payload.tv !== "number") return null;
    return { userId: payload.sub, tokenVersion: payload.tv };
  } catch {
    return null;
  }
}
