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

// Próximos días de entrega (lunes y viernes), ordenados por fecha.
export function getUpcomingDeliveryDays(): string[] {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
  const dates = [1, 5].map((day) => {
    const diff = (day - now.getDay() + 7) % 7;
    const date = new Date(now);
    date.setDate(now.getDate() + diff);
    return { day, date };
  });
  dates.sort((a, b) => a.date.getTime() - b.date.getTime());
  return dates.map((d) => formatter.format(d.date));
}
