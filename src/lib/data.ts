import { cache } from "react";
import { query, queryOne } from "@/lib/db";
import type {
  Ingredient,
  OrderStatus,
  Product,
  Redemption,
  Reward,
  SafeUser,
} from "@/lib/types";

export const getProducts = cache(
  async (): Promise<(Product & { ingredients: Ingredient[] })[]> => {
    const products = await query<Product>(
      "SELECT * FROM products WHERE active = 1 ORDER BY is_pizza_del_mes DESC, category, name"
    );

    const withIngredients = await Promise.all(
      products.map(async (p) => ({
        ...p,
        ingredients: await query<Ingredient>(
          `SELECT i.* FROM ingredients i
           JOIN product_ingredients pi ON pi.ingredient_id = i.id
           WHERE pi.product_id = $1 ORDER BY i.name`,
          [p.id]
        ),
      }))
    );

    return withIngredients;
  }
);

export const getAllProductsForAdmin = cache(async (): Promise<Product[]> => {
  return query<Product>("SELECT * FROM products ORDER BY category, name");
});

export const getProduct = cache(
  async (id: string): Promise<(Product & { ingredients: Ingredient[] }) | null> => {
    const product = await queryOne<Product>(
      "SELECT * FROM products WHERE id = $1 AND active = 1",
      [id]
    );
    if (!product) return null;

    const ingredients = await query<Ingredient>(
      `SELECT i.* FROM ingredients i
       JOIN product_ingredients pi ON pi.ingredient_id = i.id
       WHERE pi.product_id = $1 ORDER BY i.name`,
      [id]
    );

    return { ...product, ingredients };
  }
);

export const getAllIngredients = cache(async (): Promise<Ingredient[]> => {
  return query<Ingredient>(
    "SELECT * FROM ingredients WHERE available = 1 ORDER BY name"
  );
});

export const getAllIngredientsForAdmin = cache(
  async (): Promise<Ingredient[]> => {
    return query<Ingredient>(
      "SELECT * FROM ingredients ORDER BY extra_price ASC, name"
    );
  }
);

export interface OrderItemWithDetails {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  extras: Ingredient[];
}

export interface OrderWithDetails {
  id: string;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shipping: number;
  points_earned: number;
  points_spent: number;
  reward_name: string | null;
  total: number;
  payment_method: string;
  delivery_address: string;
  phone: string | null;
  note: string | null;
  created_at: string;
  user_name: string;
  user_email: string;
  items: OrderItemWithDetails[];
}

async function hydrateOrder(row: Record<string, unknown>): Promise<OrderWithDetails> {
  const items = await query<{
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
  }>("SELECT * FROM order_items WHERE order_id = $1", [row.id as string]);

  const hydratedItems: OrderItemWithDetails[] = [];
  for (const item of items) {
    const productRow = await queryOne<{ name: string }>(
      "SELECT name FROM products WHERE id = $1",
      [item.product_id]
    );
    const extras = await query<Ingredient>(
      `SELECT i.* FROM ingredients i
       JOIN order_item_ingredients oi ON oi.ingredient_id = i.id
       WHERE oi.order_item_id = $1 ORDER BY i.name`,
      [item.id]
    );
    hydratedItems.push({
      ...item,
      product_name: productRow?.name ?? "Producto",
      extras,
    });
  }

  return {
    ...(row as Omit<OrderWithDetails, "items">),
    items: hydratedItems,
  };
}

export const getOrder = cache(
  async (id: string): Promise<OrderWithDetails | null> => {
    const row = await queryOne<Record<string, unknown>>(
      `SELECT o.*, u.name AS user_name, u.email AS user_email
       FROM orders o JOIN users u ON u.id = o.user_id
       WHERE o.id = $1`,
      [id]
    );
    if (!row) return null;
    return hydrateOrder(row);
  }
);

export const getOrdersForUser = cache(
  async (userId: string): Promise<OrderWithDetails[]> => {
    const rows = await query<Record<string, unknown>>(
      `SELECT o.*, u.name AS user_name, u.email AS user_email
       FROM orders o JOIN users u ON u.id = o.user_id
       WHERE o.user_id = $1 ORDER BY o.created_at DESC`,
      [userId]
    );
    return Promise.all(rows.map(hydrateOrder));
  }
);

export const getAllOrders = cache(async (): Promise<OrderWithDetails[]> => {
  const rows = await query<Record<string, unknown>>(
    `SELECT o.*, u.name AS user_name, u.email AS user_email
     FROM orders o JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC`
  );
  return Promise.all(rows.map(hydrateOrder));
});

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalClients: number;
  pendingOrders: number;
  topProducts: { name: string; quantity: number }[];
  recentOrders: OrderWithDetails[];
}

export const getAdminStats = cache(async (): Promise<AdminStats> => {
  const revenue = await queryOne<{ total: number }>(
    "SELECT COALESCE(SUM(total), 0) AS total FROM orders WHERE status != 'CANCELADO'"
  );
  const totalOrders = await queryOne<{ n: number }>(
    "SELECT COUNT(*) AS n FROM orders"
  );
  const totalClients = await queryOne<{ n: number }>(
    "SELECT COUNT(*) AS n FROM users WHERE role = 'CLIENTE'"
  );
  const pendingOrders = await queryOne<{ n: number }>(
    "SELECT COUNT(*) AS n FROM orders WHERE status IN ('RECIBIDO','EN_PREPARACION','EMPACADO','EN_CAMINO')"
  );
  const topProducts = await query<{ name: string; quantity: number }>(
    `SELECT p.name, SUM(oi.quantity) AS quantity
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     JOIN orders o ON o.id = oi.order_id
     WHERE o.status != 'CANCELADO'
     GROUP BY p.name
     ORDER BY quantity DESC
     LIMIT 5`
  );

  const recentOrders = (await getAllOrders()).slice(0, 10);

  return {
    totalRevenue: revenue?.total ?? 0,
    totalOrders: totalOrders?.n ?? 0,
    totalClients: totalClients?.n ?? 0,
    pendingOrders: pendingOrders?.n ?? 0,
    topProducts,
    recentOrders,
  };
});

export const getUserPoints = cache(async (userId: string): Promise<number> => {
  const row = await queryOne<{ points: number }>(
    "SELECT points FROM users WHERE id = $1",
    [userId]
  );
  return row?.points ?? 0;
});

export async function getSafeUser(userId: string): Promise<SafeUser | null> {
  return queryOne<SafeUser>(
    "SELECT id, name, email, phone, address, role, points, created_at FROM users WHERE id = $1",
    [userId]
  );
}

// ---------------------------------------------------------------------------
// Recompensas
// ---------------------------------------------------------------------------

export const getRewards = cache(async (): Promise<Reward[]> => {
  return query<Reward>(
    "SELECT * FROM rewards WHERE active = 1 ORDER BY cost_points ASC"
  );
});

export const getAllRewardsForAdmin = cache(async (): Promise<Reward[]> => {
  return query<Reward>("SELECT * FROM rewards ORDER BY cost_points ASC");
});

export const getRedemptionsForUser = cache(
  async (userId: string): Promise<Redemption[]> => {
    return query<Redemption>(
      `SELECT r.id, r.user_id, r.reward_id, r.status, r.created_at,
              w.name AS reward_name, w.type AS reward_type, w.value AS reward_value, w.cost_points
       FROM redemptions r
       JOIN rewards w ON w.id = r.reward_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );
  }
);

export const getAllRedemptions = cache(async (): Promise<Redemption[]> => {
  return query<Redemption>(
    `SELECT r.id, r.user_id, r.reward_id, r.status, r.created_at,
            w.name AS reward_name, w.type AS reward_type, w.value AS reward_value, w.cost_points,
            u.name AS user_name, u.email AS user_email
     FROM redemptions r
     JOIN rewards w ON w.id = r.reward_id
     JOIN users u ON u.id = r.user_id
     ORDER BY r.created_at DESC`
  );
});

// ---------------------------------------------------------------------------
// Juego (Pizza Catcher)
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  name: string;
  best: number;
}

export const getGameLeaderboard = cache(
  async (): Promise<LeaderboardEntry[]> => {
    return query<LeaderboardEntry>(
      `SELECT u.name, MAX(g.score) AS best
       FROM game_plays g
       JOIN users u ON u.id = g.user_id
       GROUP BY u.id, u.name
       ORDER BY best DESC, u.name ASC
       LIMIT 10`
    );
  }
);

export async function getUserBestScore(userId: string): Promise<number> {
  const row = await queryOne<{ best: number }>(
    "SELECT MAX(score) AS best FROM game_plays WHERE user_id = $1",
    [userId]
  );
  return row?.best ?? 0;
}
