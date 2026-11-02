import Link from "next/link";
import { redirect } from "next/navigation";
import { Gift, Percent, Truck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getRewards, getRedemptionsForUser } from "@/lib/data";
import { describeReward, formatDate } from "@/lib/money";
import {
  REDEMPTION_STATUS_LABELS,
  REWARD_TYPE_LABELS,
} from "@/lib/types";
import type { RedemptionStatus, RewardType } from "@/lib/types";

export const metadata = { title: "Recompensas" };

const TYPE_ICON: Record<RewardType, React.ReactNode> = {
  ENVIO_GRATIS: <Truck className="h-5 w-5" />,
  DESCUENTO: <Percent className="h-5 w-5" />,
  PRODUCTO: <Gift className="h-5 w-5" />,
};

const REDEMPTION_STYLES: Record<RedemptionStatus, string> = {
  PENDIENTE: "bg-amber-50 text-amber-700 ring-amber-200",
  APLICADO: "bg-green-50 text-green-700 ring-green-200",
  CANCELADO: "bg-red-50 text-red-600 ring-red-200",
};

export default async function RewardsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar");

  const rewards = await getRewards();
  const redemptions = await getRedemptionsForUser(user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Recompensas
          </h1>
          <p className="mt-1 text-muted">
            Aplícalas con tus puntos al finalizar tu pedido.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-accent-soft px-5 py-3">
          <Gift className="h-5 w-5 text-accent" />
          <div>
            <p className="text-xs text-muted">Tus puntos</p>
            <p className="text-xl font-bold text-accent">{user.points}</p>
          </div>
        </div>
      </div>

      {/* Catálogo */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => {
          const canAfford = user.points >= reward.cost_points;
          return (
            <div
              key={reward.id}
              className="flex flex-col rounded-2xl border border-line bg-card p-5"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  {TYPE_ICON[reward.type]}
                </span>
                <span className="text-sm font-semibold text-accent">
                  {reward.cost_points} pts
                </span>
              </div>
              <h2 className="mt-4 font-display text-lg font-semibold">
                {reward.name}
              </h2>
              <p className="mt-1 flex-1 text-sm text-muted">
                {describeReward(reward.type, reward.value)}
              </p>
              <div className="mt-4">
                {canAfford ? (
                  <Link
                    href="/checkout"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                  >
                    Aplicar en mi pedido
                  </Link>
                ) : (
                  <p className="rounded-full bg-black/5 px-4 py-2.5 text-center text-sm text-muted">
                    Te faltan {reward.cost_points - user.points} pts
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Historial */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">Mis canjes</h2>

        {redemptions.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-line bg-card p-8 text-center text-sm text-muted">
            Aún no has canjeado recompensas. ¡Sigue acumulando puntos con tus
            pedidos!
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {redemptions.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-card p-4"
              >
                <div>
                  <p className="font-medium">{r.reward_name}</p>
                  <p className="text-xs text-muted">
                    {REWARD_TYPE_LABELS[r.reward_type]} ·{" "}
                    {formatDate(r.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted">
                    -{r.cost_points} pts
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${REDEMPTION_STYLES[r.status]}`}
                  >
                    {REDEMPTION_STATUS_LABELS[r.status]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-center text-sm text-muted">
        ¿Quieres sumar más puntos?{" "}
        <Link href="/productos" className="font-medium text-accent hover:underline">
          Haz un pedido
        </Link>
      </p>
    </div>
  );
}
