import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getOrder } from "@/lib/data";
import { formatCOP, formatDate } from "@/lib/money";
import { StatusBadge } from "@/components/status-badge";
import { ClearCart } from "@/components/clear-cart";
import { WhatsAppNotifyButton } from "@/components/whatsapp-notify-button";

const PAYMENT_LABELS: Record<string, string> = {
  CONTRA_ENTREGA: "Pago contra entrega",
  NEQUI: "Nequi",
  TRANSFERENCIA: "Transferencia bancaria",
};

function formatExtras(extras: { id: string; name: string }[]): string {
  const counts = new Map<string, { name: string; n: number }>();
  for (const e of extras) {
    const cur = counts.get(e.id) ?? { name: e.name, n: 0 };
    cur.n += 1;
    counts.set(e.id, cur);
  }
  return [...counts.values()]
    .map((c) => (c.n > 1 ? `${c.name} (x${c.n})` : c.name))
    .join(", ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  return { title: order ? `Pedido ${order.id.slice(0, 8)}` : "Pedido" };
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const { id } = await params;
  const { nuevo } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/ingresar`);

  const order = await getOrder(id);
  if (!order) notFound();

  if (order.user_id !== user.id && user.role !== "ADMIN") {
    redirect("/cuenta");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {nuevo === "1" && <ClearCart />}
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            ¡Gracias por tu pedido!
          </h1>
          <p className="text-sm text-muted">
            Pedido {order.id.slice(0, 8).toUpperCase()} ·{" "}
            {formatDate(order.created_at)}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Estado</h2>
          <StatusBadge status={order.status} />
        </div>

        <ul className="mt-4 space-y-3 border-t border-line pt-4">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 text-sm">
              <span>
                {item.quantity}× {item.product_name}
                {item.extras.length > 0 && (
                  <span className="block text-xs text-muted">
                    + {formatExtras(item.extras)}
                  </span>
                )}
              </span>
              <span className="font-medium">
                {formatCOP(item.unit_price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatCOP(order.subtotal)}</dd>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <dt>Descuento</dt>
              <dd>-{formatCOP(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Envío</dt>
            <dd>
              {order.shipping === 0 ? (
                <span className="text-green-600">Gratis</span>
              ) : (
                formatCOP(order.shipping)
              )}
            </dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatCOP(order.total)}</dd>
          </div>
          {order.reward_name && (
            <div className="flex justify-between text-amber-700">
              <dt>Recompensa aplicada</dt>
              <dd>
                {order.reward_name} (-{order.points_spent} pts)
              </dd>
            </div>
          )}
          {order.points_earned > 0 && (
            <div className="flex justify-between text-accent">
              <dt>Puntos ganados</dt>
              <dd>+{order.points_earned}</dd>
            </div>
          )}
        </dl>

        <div className="mt-4 grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted">Entrega</p>
            <p>{order.delivery_address}</p>
          </div>
          <div>
            <p className="text-muted">Pago</p>
            <p>{PAYMENT_LABELS[order.payment_method] ?? order.payment_method}</p>
          </div>
        </div>

        {user.role === "ADMIN" && order.phone && (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
            <div>
              <p className="text-muted">Teléfono del cliente</p>
              <p>{order.phone}</p>
            </div>
            <WhatsAppNotifyButton
              phone={order.phone}
              customerName={order.user_name.split(" ")[0]}
              orderId={order.id.slice(0, 8).toUpperCase()}
              status={order.status}
            />
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href="/cuenta"
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Ver mis pedidos
        </Link>
        <Link
          href="/productos"
          className="rounded-full border border-line bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/5"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
