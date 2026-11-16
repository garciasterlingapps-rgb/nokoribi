import { OAuth2Client } from "google-auth-library";
import { randomUUID } from "node:crypto";
import { queryOne, execute } from "@/lib/db";

const GOOGLE_SCOPE = "openid email profile";

function getGoogleConfig(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google Sign-In no está configurado");
  }
  return { clientId, clientSecret };
}

export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const { clientId } = getGoogleConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPE,
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Intercambia el código de autorización, verifica el ID token y devuelve (o
// crea) el usuario correspondiente al correo de Google.
export async function findOrCreateGoogleUser(
  code: string,
  redirectUri: string
): Promise<{ id: string }> {
  const { clientId, clientSecret } = getGoogleConfig();
  const client = new OAuth2Client(clientId, clientSecret, redirectUri);

  const { tokens } = await client.getToken(code);
  const idToken = tokens.id_token;
  if (!idToken) throw new Error("No se recibió id_token");

  const ticket = await client.verifyIdToken({ idToken, audience: clientId });
  const payload = ticket.getPayload();
  const email = payload?.email;
  if (!email) throw new Error("No se pudo obtener el correo");

  const normalizedEmail = email.toLowerCase();
  const name = payload?.name || email;

  const existing = await queryOne<{ id: string }>(
    "SELECT id FROM users WHERE email = $1",
    [normalizedEmail]
  );
  if (existing) return existing;

  const id = randomUUID();
  await execute(
    "INSERT INTO users (id, name, email, password_hash, phone, address, role, points, created_at) VALUES ($1, $2, $3, NULL, NULL, NULL, 'CLIENTE', 0, $4)",
    [id, name, normalizedEmail, new Date().toISOString()]
  );
  return { id };
}
