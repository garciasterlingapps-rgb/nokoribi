export type Role = "CLIENTE" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  address: string | null;
  role: Role;
  points: number;
  created_at: string;
}

export type SafeUser = Omit<User, "password_hash">;

export type ProductCategory = "PIZZA" | "PANADERIA" | "UNTABLES";

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  base_price: number;
  image_url: string | null;
  is_builder: number;
  is_pizza_del_mes: number;
  stock: number | null;
  active: number;
  created_at: string;
}

export interface Ingredient {
  id: string;
  name: string;
  extra_price: number;
  unit: string | null;
  available: number;
}

export type OrderStatus =
  | "RECIBIDO"
  | "EN_PREPARACION"
  | "EMPACADO"
  | "EN_CAMINO"
  | "ENTREGADO"
  | "CANCELADO";

export const ORDER_STATUSES: OrderStatus[] = [
  "RECIBIDO",
  "EN_PREPARACION",
  "EMPACADO",
  "EN_CAMINO",
  "ENTREGADO",
  "CANCELADO",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  RECIBIDO: "Recibido",
  EN_PREPARACION: "En preparación",
  EMPACADO: "Empacado",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export interface CartExtra {
  id: string;
  name: string;
  extraPrice: number;
  quantity: number;
}

export interface CartItem {
  key: string;
  productId: string;
  name: string;
  quantity: number;
  basePrice: number;
  unitPrice: number; // base + extras (para mostrar; el servidor recalcula)
  extraIds: string[];
  extras: CartExtra[];
}

export type RewardType = "ENVIO_GRATIS" | "DESCUENTO" | "PRODUCTO";

export const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  ENVIO_GRATIS: "Envío gratis",
  DESCUENTO: "Descuento",
  PRODUCTO: "Producto gratis",
};

export interface Reward {
  id: string;
  name: string;
  type: RewardType;
  cost_points: number;
  value: number;
  active: number;
}

export type RedemptionStatus = "PENDIENTE" | "APLICADO" | "CANCELADO";

export const REDEMPTION_STATUS_LABELS: Record<RedemptionStatus, string> = {
  PENDIENTE: "Pendiente",
  APLICADO: "Aplicado",
  CANCELADO: "Cancelado",
};

export interface Redemption {
  id: string;
  user_id: string;
  reward_id: string;
  status: RedemptionStatus;
  created_at: string;
  reward_name: string;
  reward_type: RewardType;
  reward_value: number;
  cost_points: number;
  user_name?: string;
  user_email?: string;
}
