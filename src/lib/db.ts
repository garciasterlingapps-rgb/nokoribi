import { Pool, types } from "pg";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

// pg devuelve BIGINT (COUNT/SUM) como string; lo convertimos a número.
types.setTypeParser(20, (val: string) => parseInt(val, 10));

// Pool global reutilizado entre invocaciones (importante en Vercel/serverless).
const globalForDb = globalThis as unknown as { __pool?: Pool };

function getPool(): Pool {
  if (!globalForDb.__pool) {
    globalForDb.__pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return globalForDb.__pool;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone         TEXT,
  address       TEXT,
  role          TEXT NOT NULL DEFAULT 'CLIENTE',
  points        INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  token      TEXT NOT NULL UNIQUE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  category    TEXT NOT NULL,
  base_price  INTEGER NOT NULL,
  image_url   TEXT,
  is_builder  INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ingredients (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  extra_price INTEGER NOT NULL DEFAULT 0,
  available   INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS product_ingredients (
  product_id    TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id),
  status           TEXT NOT NULL DEFAULT 'RECIBIDO',
  subtotal         INTEGER NOT NULL,
  discount         INTEGER NOT NULL DEFAULT 0,
  shipping         INTEGER NOT NULL DEFAULT 0,
  points_earned    INTEGER NOT NULL DEFAULT 0,
  points_spent     INTEGER NOT NULL DEFAULT 0,
  reward_name      TEXT,
  total            INTEGER NOT NULL,
  payment_method   TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  phone            TEXT,
  note             TEXT,
  created_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id         TEXT PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity   INTEGER NOT NULL,
  unit_price INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS order_item_ingredients (
  order_item_id TEXT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id),
  PRIMARY KEY (order_item_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  product_id           TEXT NOT NULL REFERENCES products(id),
  extra_ingredient_ids TEXT NOT NULL DEFAULT '[]',
  created_at           TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rewards (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,
  cost_points INTEGER NOT NULL,
  value       INTEGER NOT NULL,
  active      INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS redemptions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_id  TEXT NOT NULL REFERENCES rewards(id),
  status     TEXT NOT NULL DEFAULT 'PENDIENTE',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS point_transactions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points     INTEGER NOT NULL,
  reason     TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS game_plays (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  played_on  TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

// Imágenes de productos (archivos locales en public/images/products/).
const PRODUCT_IMAGES: Record<string, string> = {
  "Pizza Pepperoni": "/images/products/pizza-pepperoni.webp",
  "Pizza Vegetariana": "/images/products/pizza-vegetariana.webp",
  "Pizza Lomo Curado": "/images/products/pizza-lomo-curado.webp",
  "Churros (x6)": "/images/products/churros.webp",
  "Cinnamon Rolls (x4)": "/images/products/cinnamon-rolls.webp",
};

// Producto especial "Arma tu propia pizza" (constructor interactivo).
export const BUILD_YOUR_OWN_PIZZA_NAME = "Arma tu propia pizza";
const BUILD_YOUR_OWN_PIZZA_PRICE = 13000;
const BUILD_YOUR_OWN_PIZZA_DESC =
  "Elige tus ingredientes y mira cómo se arma tu pizza, paso a paso.";

// Garantiza que el esquema exista y siembra los datos iniciales (idempotente).
let ensurePromise: Promise<void> | null = null;

function ensureDatabase(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = init();
  }
  return ensurePromise;
}

async function init(): Promise<void> {
  const pool = getPool();
  await pool.query(SCHEMA);
  await seed(pool);
}

async function seed(pool: Pool): Promise<void> {
  const now = new Date().toISOString();

  // Admin user (cambia la contraseña antes de publicar)
  const adminExists = await pool.query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM users WHERE role = 'ADMIN'"
  );
  if ((adminExists.rows[0]?.n ?? 0) === 0) {
    await pool.query(
      "INSERT INTO users (id, name, email, password_hash, phone, address, role, points, created_at) VALUES ($1, $2, $3, $4, $5, $6, 'ADMIN', 0, $7)",
      [
        randomUUID(),
        "Administrador",
        "admin@nokoribi.co",
        bcrypt.hashSync("Nokoribi2026", 10),
        null,
        null,
        now,
      ]
    );
  }

  // Configuración por defecto
  for (const [key, value] of [
    ["points_per_cop", "1000"],
    ["envio_cop", "6000"],
    ["game_points_per_pizza", "5"],
  ] as const) {
    await pool.query(
      "INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, $3) ON CONFLICT (key) DO NOTHING",
      [key, value, now]
    );
  }

  // Imagen de portada del producto "Arma tu propia pizza"
  await pool.query(
    "UPDATE products SET image_url = '/images/toppings/pizza-base.png' WHERE is_builder = 1 AND (image_url IS NULL OR image_url = '')"
  );

  const count = await pool.query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM products"
  );
  if ((count.rows[0]?.n ?? 0) > 0) return;

  // Products
  const products: [string, string, string, string, number, string | null, number][] = [
    [randomUUID(), "Pizza Pepperoni", "Masa madre de larga fermentación, salsa de tomate, queso mozzarella y pepperoni. Congelada y empacada al vacío.", "PIZZA", 20000, PRODUCT_IMAGES["Pizza Pepperoni"], 0],
    [randomUUID(), "Pizza Vegetariana", "Masa madre, salsa de tomate, queso mozzarella y vegetales frescos de temporada. Congelada y empacada al vacío.", "PIZZA", 20000, PRODUCT_IMAGES["Pizza Vegetariana"], 0],
    [randomUUID(), "Pizza Lomo Curado", "Masa madre, salsa de tomate, queso mozzarella, lomo curado y rúcula. Congelada y empacada al vacío.", "PIZZA", 20000, PRODUCT_IMAGES["Pizza Lomo Curado"], 0],
    [randomUUID(), "Churros (x6)", "Churros artesanales listos para hornear o freír. Congelados y empacados al vacío.", "PANADERIA", 12000, PRODUCT_IMAGES["Churros (x6)"], 0],
    [randomUUID(), "Cinnamon Rolls (x4)", "Rollos de canela con glaseado, listos para hornear. Congelados y empacados al vacío.", "PANADERIA", 15000, PRODUCT_IMAGES["Cinnamon Rolls (x4)"], 0],
    [randomUUID(), BUILD_YOUR_OWN_PIZZA_NAME, BUILD_YOUR_OWN_PIZZA_DESC, "PIZZA", BUILD_YOUR_OWN_PIZZA_PRICE, "/images/toppings/pizza-base.png", 1],
  ];

  const ids: Record<string, string> = {};
  for (const [id, name, desc, category, price, image, isBuilder] of products) {
    await pool.query(
      "INSERT INTO products (id, name, description, category, base_price, image_url, is_builder, active, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8)",
      [id, name, desc, category, price, image, isBuilder, now]
    );
    ids[name] = id;
  }

  // Ingredients
  const ingredientDefs: [string, number][] = [
    ["Salsa de tomate", 0],
    ["Queso mozzarella", 2000],
    ["Pepperoni", 3000],
    ["Champiñones", 2500],
    ["Aceitunas", 2000],
    ["Cebolla caramelizada", 2000],
    ["Maíz dulce", 2000],
    ["Lomo curado", 4000],
    ["Rúcula", 2000],
    ["Jamón serrano", 3500],
    ["Tocino", 3500],
    ["Pimentón asado", 2500],
  ];
  const ingIds: Record<string, string> = {};
  for (const [name, extra] of ingredientDefs) {
    const id = randomUUID();
    await pool.query(
      "INSERT INTO ingredients (id, name, extra_price, available) VALUES ($1, $2, $3, 1)",
      [id, name, extra]
    );
    ingIds[name] = id;
  }

  const link = (productName: string, ingredientName: string) =>
    pool.query(
      "INSERT INTO product_ingredients (product_id, ingredient_id) VALUES ($1, $2)",
      [ids[productName], ingIds[ingredientName]]
    );

  // Default ingredients per pizza
  for (const i of ["Salsa de tomate", "Queso mozzarella", "Pepperoni"])
    await link("Pizza Pepperoni", i);
  for (const i of ["Salsa de tomate", "Queso mozzarella", "Champiñones", "Aceitunas", "Cebolla caramelizada", "Maíz dulce"])
    await link("Pizza Vegetariana", i);
  for (const i of ["Salsa de tomate", "Queso mozzarella", "Lomo curado", "Rúcula"])
    await link("Pizza Lomo Curado", i);

  // Rewards
  const rewards: [string, string, number, number][] = [
    ["Envío gratis", "ENVIO_GRATIS", 200, 0],
    ["10% de descuento", "DESCUENTO", 300, 10],
    ["Pizza gratis", "PRODUCTO", 500, 20000],
  ];
  for (const [name, type, cost, value] of rewards) {
    await pool.query(
      "INSERT INTO rewards (id, name, type, cost_points, value, active) VALUES ($1, $2, $3, $4, $5, 1)",
      [randomUUID(), name, type, cost, value]
    );
  }
}

// Helpers de consulta (asíncronos, con $n placeholders de PostgreSQL).
export async function query<T>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  await ensureDatabase();
  const res = await getPool().query(text, params);
  return res.rows as T[];
}

export async function queryOne<T>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function execute(
  text: string,
  params: unknown[] = []
): Promise<number> {
  await ensureDatabase();
  const res = await getPool().query(text, params);
  return res.rowCount ?? 0;
}
