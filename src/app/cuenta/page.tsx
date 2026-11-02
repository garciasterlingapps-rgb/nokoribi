import Link from "next/link";
import { redirect } from "next/navigation";
import { Gift, Package, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/data";
import { formatCOP, formatDate } from "@/lib/money";
import { StatusBadge } from "@/components/status-badge";
import { ProfileForm } from "@/components/profile-form";

export const metadata = { title: "Mi cuenta" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");

  const orders = await getOrdersForUser(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Hola, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-muted">{user.email}</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-accent-soft px-5 py-3">
          <Gift className="h-6 w-6 text-accent" />
          <div>
            <p className="text-xs text-muted">Tus puntos</p>
            <p className="text-xl font-bold text-accent">{user.points}</p>
          </div>
          <Link
            href="/recompensas"
            className="ml-2 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Canjear
          </Link>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-line bg-card p-5">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
          <User className="h-5 w-5" /> Mi perfil
        </h2>
        <p className="mt-1 text-sm text-muted">
          Actualiza tu nombre, teléfono y dirección de entrega.
        </p>
        <div className="mt-5">
          <ProfileForm user={user} />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
          <Package className="h-5 w-5" /> Mis pedidos
        </h2>

        {orders.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-line bg-card p-10 text-center">
            <p className="text-muted">Aún no tienes pedidos.</p>
            <Link
              href="/productos"
              className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Hacer mi primer pedido
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/pedidos/${order.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-card p-4 transition-colors hover:bg-black/5"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={order.status} />
                      <span className="text-xs text-muted">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted">
                      {order.items.reduce((a, i) => a + i.quantity, 0)} producto(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCOP(order.total)}</p>
                    {order.points_earned > 0 && (
                      <p className="text-xs text-accent">
                        +{order.points_earned} pts
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
