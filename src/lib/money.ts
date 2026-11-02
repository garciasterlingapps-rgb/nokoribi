export function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function describeReward(type: string, value: number): string {
  switch (type) {
    case "ENVIO_GRATIS":
      return "Envío a domicilio sin costo";
    case "DESCUENTO":
      return `${value}% de descuento en tu pedido`;
    case "PRODUCTO":
      return `Producto gratis hasta ${formatCOP(value)}`;
    default:
      return "";
  }
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
