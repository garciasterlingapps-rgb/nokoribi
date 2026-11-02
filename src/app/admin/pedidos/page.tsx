import Link from "next/link";
import { getAllOrders } from "@/lib/data";
import { formatCOP, formatDate } from "@/lib/money";
import { OrderStatusSelect } from "@/components/order-status-select";
import { WhatsAppNotifyButton } from "@/components/whatsapp-notify-button";

export const metadata = { title: "Pedidos" };

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  if (orders.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-card p-10 text-center text-muted">
        Aún no hay pedidos.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-card">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="border-b border-line text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Pago</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-black/[0.02]">
              <td className="px-4 py-3">
                <p className="font-medium">{o.user_name}</p>
                <p className="text-xs text-muted">{o.user_email}</p>
                {o.phone && (
                  <p className="text-xs text-muted">{o.phone}</p>
                )}
              </td>
              <td className="px-4 py-3 text-muted">
                {formatDate(o.created_at)}
              </td>
              <td className="px-4 py-3 font-medium">{formatCOP(o.total)}</td>
              <td className="px-4 py-3 capitalize">{o.payment_method}</td>
              <td className="px-4 py-3">
                <OrderStatusSelect orderId={o.id} status={o.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <WhatsAppNotifyButton
                    phone={o.phone}
                    customerName={o.user_name.split(" ")[0]}
                    orderId={o.id.slice(0, 8).toUpperCase()}
                    status={o.status}
                  />
                  <Link
                    href={`/pedidos/${o.id}`}
                    className="text-accent underline-offset-2 hover:underline"
                  >
                    Ver
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
