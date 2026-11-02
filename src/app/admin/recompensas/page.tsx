import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllRewardsForAdmin, getAllRedemptions } from "@/lib/data";
import { describeReward, formatDate } from "@/lib/money";
import { ToggleRewardButton } from "@/components/toggle-reward-button";
import { RedemptionStatusSelect } from "@/components/redemption-status-select";
import { REWARD_TYPE_LABELS } from "@/lib/types";

export const metadata = { title: "Recompensas" };

export default async function AdminRewardsPage() {
  const rewards = await getAllRewardsForAdmin();
  const redemptions = await getAllRedemptions();

  return (
    <div className="space-y-10">
      {/* Recompensas */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Recompensas</h2>
          <Link
            href="/admin/recompensas/nuevo"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" /> Nueva recompensa
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Recompensa</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Costo</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Activa</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rewards.map((r) => (
                <tr key={r.id} className="hover:bg-black/[0.02]">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">{REWARD_TYPE_LABELS[r.type]}</td>
                  <td className="px-4 py-3">{r.cost_points} pts</td>
                  <td className="px-4 py-3">{describeReward(r.type, r.value)}</td>
                  <td className="px-4 py-3">
                    <ToggleRewardButton id={r.id} active={r.active === 1} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/recompensas/${r.id}`}
                      className="text-accent underline-offset-2 hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Canjes */}
      <section>
        <h2 className="font-display text-xl font-semibold">
          Canjes de clientes
        </h2>
        <p className="mt-1 text-sm text-muted">
          Marca como "Aplicado" cuando entregues el beneficio. Al cancelar, se
          devuelven los puntos al cliente.
        </p>

        {redemptions.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-line bg-card p-8 text-center text-sm text-muted">
            Aún no hay canjes.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-card">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Recompensa</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Puntos</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {redemptions.map((r) => (
                  <tr key={r.id} className="hover:bg-black/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.user_name}</p>
                      <p className="text-xs text-muted">{r.user_email}</p>
                    </td>
                    <td className="px-4 py-3">{r.reward_name}</td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-4 py-3">-{r.cost_points}</td>
                    <td className="px-4 py-3">
                      <RedemptionStatusSelect
                        redemptionId={r.id}
                        status={r.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
