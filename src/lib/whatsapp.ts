// Utilidades para notificaciones por WhatsApp (clic-to-chat).
// Genera enlaces https://wa.me/... que abren WhatsApp con un mensaje pre-escrito.

// Normaliza un teléfono colombiano a formato internacional (solo dígitos).
// - "3001234567"      (10 dígitos, local)      → "573001234567"
// - "573001234567"    (12 dígitos, ya intl.)   → "573001234567"
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `57${digits}`;
  return digits;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const number = normalizePhone(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

const STATUS_DETAIL: Record<string, string> = {
  RECIBIDO: "Recibimos tu pedido correctamente. ¡Gracias!",
  EN_PREPARACION: "Tu pedido ya está en preparación.",
  EMPACADO: "Tu pedido está empacado al vacío.",
  EN_CAMINO: "Tu pedido va en camino a tu dirección.",
  ENTREGADO: "Tu pedido fue entregado. ¡Que lo disfrutes!",
  CANCELADO: "Lamentamos informarte que tu pedido fue cancelado.",
};

export function buildOrderStatusMessage(params: {
  customerName: string;
  orderId: string;
  statusLabel: string;
  status: string;
}): string {
  const detail = STATUS_DETAIL[params.status] ?? "";
  return [
    `¡Hola ${params.customerName}! 👋`,
    `Tu pedido ${params.orderId} en Nokoribi está: ${params.statusLabel}.`,
    detail,
    "¡Gracias por tu compra! 🍕",
  ]
    .filter(Boolean)
    .join("\n");
}
