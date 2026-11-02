import { queryOne, execute } from "@/lib/db";

export const DEFAULT_POINTS_PER_COP = 1000; // 1 punto por cada $1.000 COP
export const DEFAULT_SHIPPING_COP = 6000; // costo de envío por defecto

const SETTINGS_KEY_POINTS_PER_COP = "points_per_cop";
const SETTINGS_KEY_SHIPPING_COP = "envio_cop";
const SETTINGS_KEY_GAME_POINTS_PER_PIZZA = "game_points_per_pizza";

export async function getSetting(key: string): Promise<string | null> {
  const row = await queryOne<{ value: string }>(
    "SELECT value FROM settings WHERE key = $1",
    [key]
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await execute(
    "INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at",
    [key, value, new Date().toISOString()]
  );
}

// Cuántos pesos COP equivalen a 1 punto.
export async function getPointsPerCop(): Promise<number> {
  const raw = await getSetting(SETTINGS_KEY_POINTS_PER_COP);
  const n = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_POINTS_PER_COP;
}

export async function setPointsPerCop(value: number): Promise<void> {
  await setSetting(SETTINGS_KEY_POINTS_PER_COP, String(value));
}

// Costo de envío en COP.
export async function getShippingCost(): Promise<number> {
  const raw = await getSetting(SETTINGS_KEY_SHIPPING_COP);
  const n = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_SHIPPING_COP;
}

export async function setShippingCost(value: number): Promise<void> {
  await setSetting(SETTINGS_KEY_SHIPPING_COP, String(value));
}

// Puntos por pizza completada en el juego "Pizza Catcher".
export async function getGamePointsPerPizza(): Promise<number> {
  const raw = await getSetting(SETTINGS_KEY_GAME_POINTS_PER_PIZZA);
  const n = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(n) && n >= 0 ? n : 5;
}

export async function setGamePointsPerPizza(value: number): Promise<void> {
  await setSetting(SETTINGS_KEY_GAME_POINTS_PER_PIZZA, String(value));
}

export { SETTINGS_KEY_POINTS_PER_COP };
