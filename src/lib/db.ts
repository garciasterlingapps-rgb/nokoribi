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
  game_best     INTEGER NOT NULL DEFAULT 0,
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
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  description      TEXT NOT NULL,
  category         TEXT NOT NULL,
  base_price       INTEGER NOT NULL,
  image_url        TEXT,
  is_builder       INTEGER NOT NULL DEFAULT 0,
  is_pizza_del_mes INTEGER NOT NULL DEFAULT 0,
  stock            INTEGER,
  active           INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ingredients (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  extra_price INTEGER NOT NULL DEFAULT 0,
  unit        TEXT,
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
  points_awarded   INTEGER NOT NULL DEFAULT 0,
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
  Humus: "/images/products/humus.webp",
  "Pesto rojo con pimientos asados":
    "/images/products/pesto-rojo-pimientos-asados.webp",
  "Pesto normal": "/images/products/pesto-normal.webp",
  "Mezcla de 4 quesos untable": "/images/products/mezcla-4-quesos.webp",
  "Pizza del Mes": "/images/products/pizza-del-mes.webp",
};

// Producto especial "Arma tu propia pizza" (constructor interactivo).
export const BUILD_YOUR_OWN_PIZZA_NAME = "Arma tu propia pizza";
const BUILD_YOUR_OWN_PIZZA_PRICE = 13000;
const BUILD_YOUR_OWN_PIZZA_DESC =
  "Pizza de 30 cm de diámetro. Elige tus ingredientes y mira cómo se arma tu pizza, paso a paso.";

const DIAMETRO = "30 cm de diámetro";

// Ingredientes (precios finales tras los ajustes).
const INGREDIENTS: { name: string; extraPrice: number; unit: string | null }[] = [
  { name: "Salsa de tomate", extraPrice: 0, unit: null },
  { name: "Queso mozzarella", extraPrice: 4000, unit: null },
  { name: "Pepperoni", extraPrice: 4000, unit: null },
  { name: "Champiñones", extraPrice: 3500, unit: null },
  { name: "Aceitunas", extraPrice: 3000, unit: null },
  { name: "Cebolla caramelizada", extraPrice: 3000, unit: null },
  { name: "Maíz dulce", extraPrice: 3000, unit: null },
  { name: "Lomo curado", extraPrice: 9900, unit: "50 gr" },
  { name: "Rúcula", extraPrice: 3000, unit: null },
  { name: "Jamón serrano", extraPrice: 9900, unit: "50 gr" },
  { name: "Tocino", extraPrice: 4500, unit: null },
  { name: "Pimentón asado", extraPrice: 3500, unit: null },
  { name: "Berenjena", extraPrice: 3000, unit: null },
  { name: "Zucchini", extraPrice: 3000, unit: null },
  { name: "Albahaca", extraPrice: 3000, unit: null },
];

// Ingredientes base de la Pizza Vegetariana (nueva receta).
const VEGETARIANA_INGREDIENTS = [
  "Salsa de tomate",
  "Queso mozzarella",
  "Berenjena",
  "Zucchini",
  "Pimentón asado",
  "Aceitunas",
  "Rúcula",
  "Albahaca",
];

const VEGETARIANA_DESC = `Pizza de ${DIAMETRO}. Masa madre, salsa de tomate, queso mozzarella, berenjena, zucchini, pimentón asado, aceitunas, rúcula y albahaca. Congelada y empacada al vacío.`;

interface ProductDef {
  name: string;
  category: string;
  price: number;
  image: string | null;
  desc: string;
  isBuilder: number;
  isPizzaDelMes: number;
  stock: number | null;
}

const PRODUCTS: ProductDef[] = [
  { name: "Pizza Pepperoni", category: "PIZZA", price: 20000, image: PRODUCT_IMAGES["Pizza Pepperoni"], desc: `Pizza de ${DIAMETRO}. Masa madre de larga fermentación, salsa de tomate, queso mozzarella y pepperoni. Congelada y empacada al vacío.`, isBuilder: 0, isPizzaDelMes: 0, stock: null },
  { name: "Pizza Vegetariana", category: "PIZZA", price: 20000, image: PRODUCT_IMAGES["Pizza Vegetariana"], desc: VEGETARIANA_DESC, isBuilder: 0, isPizzaDelMes: 0, stock: null },
  { name: "Pizza Lomo Curado", category: "PIZZA", price: 20000, image: PRODUCT_IMAGES["Pizza Lomo Curado"], desc: `Pizza de ${DIAMETRO}. Masa madre, salsa de tomate, queso mozzarella, lomo curado y rúcula. Congelada y empacada al vacío.`, isBuilder: 0, isPizzaDelMes: 0, stock: null },
  { name: "Churros (x6)", category: "PANADERIA", price: 12000, image: PRODUCT_IMAGES["Churros (x6)"], desc: "Churros artesanales listos para hornear o freír. Congelados y empacados al vacío.", isBuilder: 0, isPizzaDelMes: 0, stock: null },
  { name: "Cinnamon Rolls (x4)", category: "PANADERIA", price: 15000, image: PRODUCT_IMAGES["Cinnamon Rolls (x4)"], desc: "Rollos de canela con glaseado, listos para hornear. Congelados y empacados al vacío.", isBuilder: 0, isPizzaDelMes: 0, stock: null },
  { name: BUILD_YOUR_OWN_PIZZA_NAME, category: "PIZZA", price: BUILD_YOUR_OWN_PIZZA_PRICE, image: "/images/toppings/pizza-base.png", desc: BUILD_YOUR_OWN_PIZZA_DESC, isBuilder: 1, isPizzaDelMes: 0, stock: null },
  { name: "Humus", category: "UNTABLES", price: 12000, image: PRODUCT_IMAGES["Humus"], desc: "Humus de garbanzos, cremoso y con toque de limón y tahini.", isBuilder: 0, isPizzaDelMes: 0, stock: null },
  { name: "Pesto rojo con pimientos asados", category: "UNTABLES", price: 14000, image: PRODUCT_IMAGES["Pesto rojo con pimientos asados"], desc: "Pesto rojo con pimientos asados, frutos secos y queso.", isBuilder: 0, isPizzaDelMes: 0, stock: null },
  { name: "Pesto normal", category: "UNTABLES", price: 12000, image: PRODUCT_IMAGES["Pesto normal"], desc: "Pesto clásico de albahaca, piñones, ajo y queso.", isBuilder: 0, isPizzaDelMes: 0, stock: null },
  { name: "Mezcla de 4 quesos untable", category: "UNTABLES", price: 15000, image: PRODUCT_IMAGES["Mezcla de 4 quesos untable"], desc: "Mezcla cremosa de 4 quesos, ideal para untar.", isBuilder: 0, isPizzaDelMes: 0, stock: null },
  { name: "Pizza del Mes", category: "PIZZA", price: 22000, image: PRODUCT_IMAGES["Pizza del Mes"], desc: `Nuestra pizza especial de este mes (${DIAMETRO}). Edición limitada.`, isBuilder: 0, isPizzaDelMes: 1, stock: 50 },
];

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
  await migrate(pool);
  await seed(pool);
}

async function migrate(pool: Pool): Promise<void> {
  await pool.query("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS unit TEXT");
  await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS is_pizza_del_mes INTEGER NOT NULL DEFAULT 0");
  await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER");
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS game_best INTEGER NOT NULL DEFAULT 0");
  await pool.query("ALTER TABLE game_plays DROP COLUMN IF EXISTS score");
  await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS points_awarded INTEGER NOT NULL DEFAULT 0");
}

async function seed(pool: Pool): Promise<void> {
  const now = new Date().toISOString();

  // Admin user: la contraseña se toma de la variable de entorno ADMIN_PASSWORD
  // (ver .env.example). Si no está definida, no se crea el admin automáticamente.
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword) {
    const adminExists = await pool.query<{ n: number }>(
      "SELECT COUNT(*) AS n FROM users WHERE role = 'ADMIN'"
    );
    if ((adminExists.rows[0]?.n ?? 0) === 0) {
      await pool.query(
        "INSERT INTO users (id, name, email, password_hash, phone, address, role, points, created_at) VALUES ($1, $2, $3, $4, $5, $6, 'ADMIN', 0, $7)",
        [randomUUID(), "Administrador", "admin@nokoribi.co", bcrypt.hashSync(adminPassword, 10), null, null, now]
      );
    }
  }

  // Configuración por defecto
  for (const [key, value] of [
    ["points_per_cop", "1000"],
    ["envio_cop", "6000"],
    ["game_points_per_pizza", "5"],
    ["game_daily_max_points", "50"],
  ] as const) {
    await pool.query(
      "INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, $3) ON CONFLICT (key) DO NOTHING",
      [key, value, now]
    );
  }

  // Upsert de ingredientes (actualiza precios/unidad, agrega nuevos)
  for (const ing of INGREDIENTS) {
    const existing = await pool.query("SELECT id FROM ingredients WHERE name = $1", [ing.name]);
    if (existing.rows[0]) {
      await pool.query(
        "UPDATE ingredients SET extra_price = $1, unit = $2 WHERE id = $3",
        [ing.extraPrice, ing.unit, existing.rows[0].id]
      );
    } else {
      await pool.query(
        "INSERT INTO ingredients (id, name, extra_price, unit, available) VALUES ($1, $2, $3, $4, 1)",
        [randomUUID(), ing.name, ing.extraPrice, ing.unit]
      );
    }
  }

  // Productos: insertar los que falten (NO sobrescribir los existentes, para
  // no borrar los cambios que haga el admin en la Pizza del Mes).
  for (const p of PRODUCTS) {
    const existing = await pool.query("SELECT id FROM products WHERE name = $1", [
      p.name,
    ]);
    if (existing.rows[0]) {
      // Solo rellenar la imagen si faltaba (no tocar descripción/precio)
      await pool.query(
        "UPDATE products SET image_url = COALESCE(image_url, $1) WHERE id = $2",
        [p.image, existing.rows[0].id]
      );
      continue;
    }

    // Pizza del Mes: solo crear el placeholder si no hay ninguna ya marcada.
    if (p.isPizzaDelMes === 1) {
      const anyMes = await pool.query(
        "SELECT id FROM products WHERE is_pizza_del_mes = 1"
      );
      if (anyMes.rows[0]) continue;
    }

    await pool.query(
      "INSERT INTO products (id, name, description, category, base_price, image_url, is_builder, is_pizza_del_mes, stock, active, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1,$10)",
      [randomUUID(), p.name, p.desc, p.category, p.price, p.image, p.isBuilder, p.isPizzaDelMes, p.stock, now]
    );
  }

  // Migración única: actualizar la receta de la Pizza Vegetariana (solo si aún
  // muestra la receta antigua, para no pisar ediciones posteriores del admin).
  await pool.query(
    "UPDATE products SET description = $1 WHERE name = 'Pizza Vegetariana' AND description NOT LIKE '%berenjena%'",
    [VEGETARIANA_DESC]
  );

  // Migración única: especificar el diámetro de 30 cm en las pizzas que aún no
  // lo indican.
  await pool.query(
    "UPDATE products SET description = 'Pizza de 30 cm de diámetro. ' || description WHERE category = 'PIZZA' AND description NOT LIKE '%30 cm%'"
  );

  // Receta de la Pizza Vegetariana (idempotente y segura ante concurrencia)
  for (const ingName of VEGETARIANA_INGREDIENTS) {
    await pool.query(
      `INSERT INTO product_ingredients (product_id, ingredient_id)
       SELECT p.id, i.id FROM products p, ingredients i
       WHERE p.name = 'Pizza Vegetariana' AND i.name = $1
       ON CONFLICT (product_id, ingredient_id) DO NOTHING`,
      [ingName]
    );
  }
  // Eliminar los ingredientes que ya no forman parte de la receta vegetariana.
  for (const oldName of ["Champiñones", "Cebolla caramelizada", "Maíz dulce"]) {
    await pool.query(
      `DELETE FROM product_ingredients
       WHERE product_id = (SELECT id FROM products WHERE name = 'Pizza Vegetariana')
         AND ingredient_id = (SELECT id FROM ingredients WHERE name = $1)`,
      [oldName]
    );
  }

  // Recompensas (solo si no hay)
  const rewardsCount = await pool.query<{ n: number }>("SELECT COUNT(*) AS n FROM rewards");
  if ((rewardsCount.rows[0]?.n ?? 0) === 0) {
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
