import type { OrderStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

const STATUS_STYLES: Record<OrderStatus, string> = {
  RECIBIDO: "bg-blue-50 text-blue-700 ring-blue-200",
  EN_PREPARACION: "bg-amber-50 text-amber-700 ring-amber-200",
  EMPACADO: "bg-violet-50 text-violet-700 ring-violet-200",
  EN_CAMINO: "bg-orange-50 text-orange-700 ring-orange-200",
  ENTREGADO: "bg-green-50 text-green-700 ring-green-200",
  CANCELADO: "bg-red-50 text-red-600 ring-red-200",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
