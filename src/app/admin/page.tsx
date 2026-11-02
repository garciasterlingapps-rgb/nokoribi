import Link from "next/link";
import { getAdminStats } from "@/lib/data";
import { formatCOP, formatDate } from "@/lib/money";
import { StatusBadge } from "@/components/status-badge";

export const metadata = { title: "Resumen" };

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const cards = [
    {
      label: "Ingresos (sin cancelados)",
      value: formatCOP(stats.totalRevenue),
    },
    { label: "Pedidos totales", value: String(stats.totalOrders) },
    { label: "Clientes registrados", value: String(stats.totalClients) },
    { label: "Pedidos activos", value: String(stats.pendingOrders) },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-line bg-card p-5">
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Top productos */}
        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="font-semibold">Productos más vendidos</h2>
          {stats.topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Sin ventas todavía.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {stats.topProducts.map((p) => (
                <li
                  key={p.name}
                  className="flex items-center justify-between border-b border-line pb-2 text-sm last:border-0"
                >
                  <span>{p.name}</span>
                  <span className="font-medium">{p.quantity} uds</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Pedidos recientes */}
        <section className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Pedidos recientes</h2>
            <Link href="/admin/pedidos" className="text-sm text-accent hover:underline">
              Ver todos
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Sin pedidos todavía.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.recentOrders.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/pedidos/${o.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-sm transition-colors hover:bg-black/5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{o.user_name}</p>
                      <p className="text-xs text-muted">
                        {formatDate(o.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-none items-center gap-2">
                      <span className="font-medium">{formatCOP(o.total)}</span>
                      <StatusBadge status={o.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
