"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { queryOne, execute } from "@/lib/db";
import {
  createSession,
  setSessionCookie,
  destroySession,
  getCurrentUser,
  requireAdmin,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import type { Reward } from "@/lib/types";
import {
  getGamePointsPerPizza,
  getPointsPerCop,
  getShippingCost,
  setGamePointsPerPizza,
  setPointsPerCop,
  setShippingCost,
} from "@/lib/settings";
import { computeOrderTotals } from "@/lib/rewards";

export interface ActionState {
  error?: string;
  success?: string;
}

// ---------------------------------------------------------------------------
// Autenticación
// ---------------------------------------------------------------------------

const registerSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre completo"),
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { name, email, password, phone, address } = parsed.data;

  const existing = await queryOne<{ id: string }>(
    "SELECT id FROM users WHERE email = $1",
    [email.toLowerCase()]
  );
  if (existing) {
    return { error: "Ya existe una cuenta con ese correo" };
  }

  const passwordHash = await hashPassword(password);
  const id = randomUUID();
  await execute(
    "INSERT INTO users (id, name, email, password_hash, phone, address, role, points, created_at) VALUES ($1, $2, $3, $4, $5, $6, 'CLIENTE', 0, $7)",
    [id, name, email.toLowerCase(), passwordHash, phone || null, address || null, new Date().toISOString()]
  );

  const token = await createSession(id);
  await setSessionCookie(token);

  redirect("/cuenta");
}

const loginSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const row = await queryOne<{ id: string; password_hash: string }>(
    "SELECT * FROM users WHERE email = $1",
    [parsed.data.email.toLowerCase()]
  );

  if (!row) return { error: "Correo o contraseña incorrectos" };

  const ok = await verifyPassword(parsed.data.password, row.password_hash);
  if (!ok) return { error: "Correo o contraseña incorrectos" };

  const token = await createSession(row.id);
  await setSessionCookie(token);

  redirect("/cuenta");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre completo"),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { name, phone, address } = parsed.data;
  await execute(
    "UPDATE users SET name = $1, phone = $2, address = $3 WHERE id = $4",
    [name, phone || null, address || null, user.id]
  );

  revalidatePath("/cuenta");
  revalidatePath("/checkout");
  return { success: "Perfil actualizado" };
}

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------

const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  extraIds: z.array(z.string()),
});
const cartSchema = z.array(cartItemSchema).min(1, "El carrito está vacío");

const checkoutSchema = z.object({
  cart: z.string().min(1),
  paymentMethod: z.enum(["CONTRA_ENTREGA", "NEQUI", "TRANSFERENCIA"]),
  deliveryAddress: z.string().trim().min(5, "Escribe tu dirección de entrega"),
  phone: z.string().trim().min(7, "Escribe un teléfono válido"),
  note: z.string().trim().optional(),
  rewardId: z.string().optional(),
});

export async function placeOrderAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");

  const parsed = checkoutSchema.safeParse({
    cart: formData.get("cart"),
    paymentMethod: formData.get("paymentMethod"),
    deliveryAddress: formData.get("deliveryAddress"),
    phone: formData.get("phone"),
    note: formData.get("note") || undefined,
    rewardId: formData.get("rewardId") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  let cart: z.infer<typeof cartItemSchema>[];
  try {
    const raw = JSON.parse(parsed.data.cart);
    const cartParsed = cartSchema.safeParse(raw);
    if (!cartParsed.success) return { error: "Carrito inválido" };
    cart = cartParsed.data;
  } catch {
    return { error: "Carrito inválido" };
  }

  // Recalcular precios de forma autoritativa (evita manipulación desde el cliente)
  let subtotal = 0;
  const lines: {
    productId: string;
    quantity: number;
    unitPrice: number;
    extraIds: string[];
    isPizzaDelMes: number;
  }[] = [];

  for (const item of cart) {
    const product = await queryOne<{
      id: string;
      name: string;
      base_price: number;
      is_pizza_del_mes: number;
      stock: number | null;
    }>("SELECT * FROM products WHERE id = $1 AND active = 1", [item.productId]);
    if (!product) return { error: "Uno de los productos ya no está disponible" };

    if (
      product.is_pizza_del_mes === 1 &&
      (product.stock ?? 0) < item.quantity
    ) {
      return {
        error: `No queda suficiente stock de "${product.name}". Quedan ${
          product.stock ?? 0
        } disponibles.`,
      };
    }

    let unitPrice = product.base_price;
    for (const extraId of item.extraIds) {
      const ing = await queryOne<{ extra_price: number }>(
        "SELECT * FROM ingredients WHERE id = $1 AND available = 1",
        [extraId]
      );
      if (!ing) return { error: "Uno de los ingredientes no está disponible" };
      unitPrice += ing.extra_price;
    }

    lines.push({
      productId: product.id,
      quantity: item.quantity,
      unitPrice,
      extraIds: item.extraIds,
      isPizzaDelMes: product.is_pizza_del_mes,
    });
    subtotal += unitPrice * item.quantity;
  }

  // Recompensa opcional aplicada en el checkout
  const shippingCost = await getShippingCost();
  let reward: Reward | null = null;

  if (parsed.data.rewardId) {
    reward = await queryOne<Reward>(
      "SELECT * FROM rewards WHERE id = $1 AND active = 1",
      [parsed.data.rewardId]
    );
    if (!reward) {
      return { error: "La recompensa seleccionada ya no está disponible" };
    }
  }

  const { discount, shipping, total } = computeOrderTotals(
    subtotal,
    shippingCost,
    reward
  );
  const pointsSpent = reward ? reward.cost_points : 0;
  const pointsEarned = Math.floor(total / (await getPointsPerCop()));

  const orderId = randomUUID();
  const now = new Date().toISOString();

  // Descontar los puntos de la recompensa ANTES de crear el pedido
  if (reward) {
    const deducted = await execute(
      "UPDATE users SET points = points - $1 WHERE id = $2 AND points >= $1",
      [reward.cost_points, user.id]
    );
    if (deducted === 0) {
      return { error: "No tienes puntos suficientes para esa recompensa" };
    }
  }

  await execute(
    `INSERT INTO orders
      (id, user_id, status, subtotal, discount, shipping, points_earned, points_spent, reward_name, total, payment_method, delivery_address, phone, note, created_at)
     VALUES ($1, $2, 'RECIBIDO', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [
      orderId,
      user.id,
      subtotal,
      discount,
      shipping,
      pointsEarned,
      pointsSpent,
      reward ? reward.name : null,
      total,
      parsed.data.paymentMethod,
      parsed.data.deliveryAddress,
      parsed.data.phone,
      parsed.data.note || null,
      now,
    ]
  );

  for (const line of lines) {
    const itemId = randomUUID();
    await execute(
      "INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4, $5)",
      [itemId, orderId, line.productId, line.quantity, line.unitPrice]
    );
    for (const extraId of line.extraIds) {
      await execute(
        "INSERT INTO order_item_ingredients (order_item_id, ingredient_id) VALUES ($1, $2)",
        [itemId, extraId]
      );
    }

    // Descontar el stock de la Pizza del Mes
    if (line.isPizzaDelMes === 1) {
      await execute(
        "UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2 AND is_pizza_del_mes = 1",
        [line.quantity, line.productId]
      );
    }
  }

  // Registrar el canje de la recompensa
  if (reward) {
    await execute(
      "INSERT INTO point_transactions (id, user_id, points, reason, created_at) VALUES ($1, $2, $3, $4, $5)",
      [randomUUID(), user.id, -reward.cost_points, `Canje aplicado: ${reward.name}`, now]
    );
    await execute(
      "INSERT INTO redemptions (id, user_id, reward_id, status, created_at) VALUES ($1, $2, $3, 'APLICADO', $4)",
      [randomUUID(), user.id, reward.id, now]
    );
  }

  // Puntos ganados por la compra
  if (pointsEarned > 0) {
    await execute("UPDATE users SET points = points + $1 WHERE id = $2", [
      pointsEarned,
      user.id,
    ]);
    await execute(
      "INSERT INTO point_transactions (id, user_id, points, reason, created_at) VALUES ($1, $2, $3, $4, $5)",
      [randomUUID(), user.id, pointsEarned, "Compra", now]
    );
  }

  revalidatePath("/cuenta");
  revalidatePath("/admin");
  revalidatePath("/recompensas");
  redirect(`/pedidos/${orderId}?nuevo=1`);
}

// ---------------------------------------------------------------------------
// Administración
// ---------------------------------------------------------------------------

export async function updateOrderStatusAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado" };

  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  const allowed = [
    "RECIBIDO",
    "EN_PREPARACION",
    "EMPACADO",
    "EN_CAMINO",
    "ENTREGADO",
    "CANCELADO",
  ];
  if (!orderId || !allowed.includes(status)) {
    return { error: "Datos inválidos" };
  }

  await execute("UPDATE orders SET status = $1 WHERE id = $2", [status, orderId]);

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  return { success: "Estado actualizado" };
}

const productSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del producto"),
  description: z.string().trim().min(5, "Escribe una descripción"),
  category: z.enum(["PIZZA", "PANADERIA", "UNTABLES"]),
  basePrice: z.coerce.number().int().min(0, "Precio inválido"),
  active: z.enum(["1", "0"]),
  imageUrl: z.string().trim().optional(),
  isPizzaDelMes: z.enum(["1", "0"]).optional(),
  stock: z.string().trim().optional(),
});

export async function saveProductAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado" };

  const id = formData.get("id");
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    category: formData.get("category"),
    basePrice: formData.get("basePrice"),
    active: formData.get("active") ?? "1",
    imageUrl: formData.get("imageUrl") || undefined,
    isPizzaDelMes: formData.get("isPizzaDelMes") ?? "0",
    stock: formData.get("stock") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { name, description, category, basePrice, active, imageUrl } =
    parsed.data;
  const image = imageUrl?.trim() ? imageUrl.trim() : null;

  const isPizzaDelMes = Number(parsed.data.isPizzaDelMes ?? "0");
  const stockStr = parsed.data.stock?.trim();
  const stock =
    isPizzaDelMes === 1
      ? stockStr
        ? Math.max(0, Math.floor(Number(stockStr) || 0))
        : 0
      : null;

  if (id && typeof id === "string" && id.length > 0) {
    await execute(
      "UPDATE products SET name = $1, description = $2, category = $3, base_price = $4, active = $5, image_url = $6, is_pizza_del_mes = $7, stock = $8 WHERE id = $9",
      [name, description, category, basePrice, Number(active), image, isPizzaDelMes, stock, id]
    );
  } else {
    await execute(
      "INSERT INTO products (id, name, description, category, base_price, image_url, active, is_pizza_del_mes, stock, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
      [randomUUID(), name, description, category, basePrice, image, Number(active), isPizzaDelMes, stock, new Date().toISOString()]
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  return { success: "Producto guardado" };
}

export async function toggleProductActiveAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado" };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Datos inválidos" };

  const row = await queryOne<{ active: number }>(
    "SELECT active FROM products WHERE id = $1",
    [id]
  );
  if (!row) return { error: "Producto no encontrado" };

  await execute("UPDATE products SET active = $1 WHERE id = $2", [
    row.active ? 0 : 1,
    id,
  ]);

  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  return { success: "Producto actualizado" };
}

const ingredientPriceSchema = z.object({
  id: z.string().min(1),
  extraPrice: z.coerce.number().int().min(0, "Precio inválido"),
});

export async function saveIngredientAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado" };

  const parsed = ingredientPriceSchema.safeParse({
    id: formData.get("id"),
    extraPrice: formData.get("extraPrice"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await execute("UPDATE ingredients SET extra_price = $1 WHERE id = $2", [
    parsed.data.extraPrice,
    parsed.data.id,
  ]);

  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  return { success: "Precio actualizado" };
}

export async function toggleIngredientActiveAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado" };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Datos inválidos" };

  const row = await queryOne<{ available: number }>(
    "SELECT available FROM ingredients WHERE id = $1",
    [id]
  );
  if (!row) return { error: "Ingrediente no encontrado" };

  await execute("UPDATE ingredients SET available = $1 WHERE id = $2", [
    row.available ? 0 : 1,
    id,
  ]);

  revalidatePath("/admin/productos");
  revalidatePath("/productos");
  return { success: "Ingrediente actualizado" };
}

// ---------------------------------------------------------------------------
// Recompensas y puntos
// ---------------------------------------------------------------------------

export async function redeemRewardAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");

  const rewardId = String(formData.get("rewardId") ?? "");
  if (!rewardId) return { error: "Recompensa inválida" };

  const reward = await queryOne<Reward>(
    "SELECT * FROM rewards WHERE id = $1 AND active = 1",
    [rewardId]
  );
  if (!reward) return { error: "Recompensa no disponible" };

  // Descuenta los puntos solo si alcanzan (guard atómico en la consulta)
  const affected = await execute(
    "UPDATE users SET points = points - $1 WHERE id = $2 AND points >= $1",
    [reward.cost_points, user.id]
  );
  if (affected === 0) {
    return { error: "No tienes puntos suficientes para esta recompensa" };
  }

  const now = new Date().toISOString();
  await execute(
    "INSERT INTO redemptions (id, user_id, reward_id, status, created_at) VALUES ($1, $2, $3, 'PENDIENTE', $4)",
    [randomUUID(), user.id, reward.id, now]
  );
  await execute(
    "INSERT INTO point_transactions (id, user_id, points, reason, created_at) VALUES ($1, $2, $3, $4, $5)",
    [randomUUID(), user.id, -reward.cost_points, `Canje: ${reward.name}`, now]
  );

  revalidatePath("/recompensas");
  revalidatePath("/cuenta");
  return { success: `Recompensa canjeada: ${reward.name}` };
}

const redemptionStatusSchema = z.object({
  redemptionId: z.string().min(1),
  status: z.enum(["PENDIENTE", "APLICADO", "CANCELADO"]),
});

export async function updateRedemptionStatusAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado" };

  const parsed = redemptionStatusSchema.safeParse({
    redemptionId: formData.get("redemptionId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { error: "Datos inválidos" };

  const { redemptionId, status } = parsed.data;

  const redemption = await queryOne<{
    user_id: string;
    status: string;
    cost_points: number;
  }>(
    `SELECT r.user_id, r.status, w.cost_points
     FROM redemptions r JOIN rewards w ON w.id = r.reward_id
     WHERE r.id = $1`,
    [redemptionId]
  );
  if (!redemption) return { error: "Canje no encontrado" };

  // Si se cancela un canje que no estaba cancelado, se devuelven los puntos
  if (status === "CANCELADO" && redemption.status !== "CANCELADO") {
    await execute("UPDATE users SET points = points + $1 WHERE id = $2", [
      redemption.cost_points,
      redemption.user_id,
    ]);
    await execute(
      "INSERT INTO point_transactions (id, user_id, points, reason, created_at) VALUES ($1, $2, $3, $4, $5)",
      [randomUUID(), redemption.user_id, redemption.cost_points, "Devolución de canje cancelado", new Date().toISOString()]
    );
  }

  await execute("UPDATE redemptions SET status = $1 WHERE id = $2", [
    status,
    redemptionId,
  ]);

  revalidatePath("/admin/recompensas");
  revalidatePath("/recompensas");
  revalidatePath("/cuenta");
  return { success: "Estado actualizado" };
}

const rewardSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre de la recompensa"),
  type: z.enum(["ENVIO_GRATIS", "DESCUENTO", "PRODUCTO"]),
  costPoints: z.coerce.number().int().min(1, "Costo en puntos inválido"),
  value: z.coerce.number().int().min(0, "Valor inválido"),
  active: z.enum(["1", "0"]),
});

export async function saveRewardAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado" };

  const id = formData.get("id");
  const parsed = rewardSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    costPoints: formData.get("costPoints"),
    value: formData.get("value"),
    active: formData.get("active") ?? "1",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { name, type, costPoints, value, active } = parsed.data;

  if (id && typeof id === "string" && id.length > 0) {
    await execute(
      "UPDATE rewards SET name = $1, type = $2, cost_points = $3, value = $4, active = $5 WHERE id = $6",
      [name, type, costPoints, value, Number(active), id]
    );
  } else {
    await execute(
      "INSERT INTO rewards (id, name, type, cost_points, value, active) VALUES ($1, $2, $3, $4, $5, $6)",
      [randomUUID(), name, type, costPoints, value, Number(active)]
    );
  }

  revalidatePath("/admin/recompensas");
  revalidatePath("/recompensas");
  return { success: "Recompensa guardada" };
}

export async function toggleRewardActiveAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado" };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Datos inválidos" };

  const row = await queryOne<{ active: number }>(
    "SELECT active FROM rewards WHERE id = $1",
    [id]
  );
  if (!row) return { error: "Recompensa no encontrada" };

  await execute("UPDATE rewards SET active = $1 WHERE id = $2", [
    row.active ? 0 : 1,
    id,
  ]);

  revalidatePath("/admin/recompensas");
  revalidatePath("/recompensas");
  return { success: "Recompensa actualizada" };
}

// ---------------------------------------------------------------------------
// Configuración del negocio
// ---------------------------------------------------------------------------

const settingsSchema = z.object({
  pointsPerCop: z.coerce.number().int().min(1, "El valor debe ser mayor a 0"),
  shippingCost: z.coerce.number().int().min(0, "El valor debe ser 0 o mayor"),
  gamePointsPerPizza: z.coerce.number().int().min(0, "El valor debe ser 0 o mayor"),
});

export async function saveSettingsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "No autorizado" };

  const parsed = settingsSchema.safeParse({
    pointsPerCop: formData.get("pointsPerCop"),
    shippingCost: formData.get("shippingCost"),
    gamePointsPerPizza: formData.get("gamePointsPerPizza"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await setPointsPerCop(parsed.data.pointsPerCop);
  await setShippingCost(parsed.data.shippingCost);
  await setGamePointsPerPizza(parsed.data.gamePointsPerPizza);

  revalidatePath("/admin/configuracion");
  revalidatePath("/checkout");
  return { success: "Configuración guardada" };
}

// ---------------------------------------------------------------------------
// Juego "Pizza Catcher"
// ---------------------------------------------------------------------------

export interface GameResult {
  error?: string;
  needsLogin?: boolean;
  firstPlay?: boolean;
  pointsEarned?: number;
  orders?: number;
}

export async function submitGameScoreAction(orders: number): Promise<GameResult> {
  const user = await getCurrentUser();
  if (!user) return { needsLogin: true };

  const safeOrders = Math.max(0, Math.min(100, Math.floor(orders)));
  if (safeOrders === 0) {
    return { orders: 0, pointsEarned: 0, firstPlay: false };
  }

  const today = new Date().toISOString().slice(0, 10);

  const played = await queryOne<{ x: number }>(
    "SELECT 1 AS x FROM game_plays WHERE user_id = $1 AND played_on = $2",
    [user.id, today]
  );
  if (played) {
    return { firstPlay: false, orders: safeOrders, pointsEarned: 0 };
  }

  const points = safeOrders * (await getGamePointsPerPizza());
  const now = new Date().toISOString();

  if (points > 0) {
    await execute("UPDATE users SET points = points + $1 WHERE id = $2", [
      points,
      user.id,
    ]);
    await execute(
      "INSERT INTO point_transactions (id, user_id, points, reason, created_at) VALUES ($1, $2, $3, $4, $5)",
      [randomUUID(), user.id, points, "Juego: Pizza Catcher", now]
    );
  }

  await execute(
    "INSERT INTO game_plays (id, user_id, played_on, created_at) VALUES ($1, $2, $3, $4)",
    [randomUUID(), user.id, today, now]
  );

  revalidatePath("/cuenta");
  revalidatePath("/recompensas");
  return { firstPlay: true, orders: safeOrders, pointsEarned: points };
}
