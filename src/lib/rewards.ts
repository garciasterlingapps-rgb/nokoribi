import type { Reward } from "@/lib/types";

export interface OrderTotals {
  discount: number;
  shipping: number;
  total: number;
}

// Calcula descuento, envío y total de un pedido, aplicando una recompensa.
// Se comparte entre el cliente (vista previa) y el servidor (cálculo autoritativo)
// para que ambos siempre coincidan.
export function computeOrderTotals(
  subtotal: number,
  shippingCost: number,
  reward: Reward | null
): OrderTotals {
  let discount = 0;
  let shipping = shippingCost;

  if (reward) {
    switch (reward.type) {
      case "ENVIO_GRATIS":
        shipping = 0;
        break;
      case "DESCUENTO":
        discount = Math.floor((subtotal * reward.value) / 100);
        break;
      case "PRODUCTO":
        discount = Math.min(reward.value, subtotal);
        break;
    }
  }

  const total = subtotal - discount + shipping;
  return { discount, shipping, total };
}
