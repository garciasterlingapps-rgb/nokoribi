"use client";

import { useActionState, useState } from "react";
import { ArrowLeft, Gift } from "lucide-react";
import Link from "next/link";
import { placeOrderAction } from "@/lib/actions";
import { useCart } from "@/components/cart-provider";
import { describeReward, formatCOP } from "@/lib/money";
import { computeOrderTotals } from "@/lib/rewards";
import type { Reward, SafeUser } from "@/lib/types";

const PAYMENT_METHODS = [
  { value: "CONTRA_ENTREGA", label: "Pago contra entrega" },
  { value: "NEQUI", label: "Nequi" },
  { value: "TRANSFERENCIA", label: "Transferencia bancaria" },
];

export function CheckoutForm({
  user,
  pointsPerCop,
  shippingCost,
  rewards,
}: {
  user: SafeUser;
  pointsPerCop: number;
  shippingCost: number;
  rewards: Reward[];
}) {
  const { items, subtotal } = useCart();
  const [state, formAction, pending] = useActionState(placeOrderAction, {});
  const [rewardId, setRewardId] = useState("");

  const selectedReward = rewards.find((r) => r.id === rewardId) ?? null;
  const totals = computeOrderTotals(subtotal, shippingCost, selectedReward);
  const pointsPreview = Math.floor(totals.total / pointsPerCop);
  const pointsSpent = selectedReward ? selectedReward.cost_points : 0;

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {/* Dirección */}
        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="font-semibold">Dirección de entrega</h2>
          <label className="mt-4 block text-sm text-muted">
            Dirección
            <input
              type="text"
              name="deliveryAddress"
              defaultValue={user.address ?? ""}
              placeholder="Calle, carrera, barrio, ciudad"
              className="mt-1 w-full rounded-xl border border-line bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </label>
          <label className="mt-4 block text-sm text-muted">
            Teléfono (para coordinar la entrega)
            <input
              type="tel"
              name="phone"
              defaultValue={user.phone ?? ""}
              placeholder="Ej. 300 123 4567"
              className="mt-1 w-full rounded-xl border border-line bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </label>
          <label className="mt-4 block text-sm text-muted">
            Nota (opcional)
            <input
              type="text"
              name="note"
              placeholder="Ej. Llamar al llegar, portería, etc."
              className="mt-1 w-full rounded-xl border border-line bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
        </section>

        {/* Pago */}
        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="font-semibold">Método de pago</h2>
          <div className="mt-4 space-y-2">
            {PAYMENT_METHODS.map((m) => (
              <label
                key={m.value}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3 transition-colors hover:bg-black/5"
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={m.value}
                  defaultChecked={m.value === "CONTRA_ENTREGA"}
                  className="h-4 w-4 accent-accent"
                />
                {m.label}
              </label>
            ))}
          </div>
        </section>

        {/* Recompensas */}
        <section className="rounded-2xl border border-line bg-card p-5">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-accent" />
            <h2 className="font-semibold">Usar puntos (recompensas)</h2>
          </div>
          <p className="mt-1 text-sm text-muted">
            Tienes <strong className="text-foreground">{user.points}</strong>{" "}
            puntos disponibles.
          </p>

          <div className="mt-4 space-y-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3 transition-colors hover:bg-black/5">
              <input
                type="radio"
                name="rewardId"
                value=""
                checked={rewardId === ""}
                onChange={() => setRewardId("")}
                className="h-4 w-4 accent-accent"
              />
              No usar recompensa
            </label>

            {rewards.map((r) => {
              const canAfford = user.points >= r.cost_points;
              return (
                <label
                  key={r.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3 transition-colors ${
                    canAfford ? "hover:bg-black/5" : "cursor-not-allowed opacity-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="rewardId"
                    value={r.id}
                    disabled={!canAfford}
                    checked={rewardId === r.id}
                    onChange={() => setRewardId(r.id)}
                    className="h-4 w-4 accent-accent"
                  />
                  <span className="flex-1">
                    <span className="block font-medium">
                      {r.name}{" "}
                      <span className="text-sm font-normal text-accent">
                        · {r.cost_points} pts
                      </span>
                    </span>
                    <span className="block text-xs text-muted">
                      {describeReward(r.type, r.value)}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {/* Resumen de productos */}
        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="font-semibold">Tu pedido</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.key} className="flex justify-between gap-2">
                <span className="text-muted">
                  {i.quantity}× {i.name}
                  {i.extras.length > 0 && (
                    <span className="block text-xs text-muted/70">
                      + {i.extras.map((e) => e.name).join(", ")}
                    </span>
                  )}
                </span>
                <span className="font-medium">
                  {formatCOP(i.unitPrice * i.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="h-fit rounded-2xl border border-line bg-card p-5">
        <h2 className="font-semibold">Resumen</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatCOP(subtotal)}</dd>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <dt>Descuento</dt>
              <dd>-{formatCOP(totals.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Envío</dt>
            <dd>
              {totals.shipping === 0 ? (
                <span className="text-green-600">Gratis</span>
              ) : (
                formatCOP(totals.shipping)
              )}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatCOP(totals.total)}</dd>
          </div>
        </dl>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">
            <span className="text-lg">🎁</span>
            Ganarás <strong>{pointsPreview} puntos</strong> con este pedido
          </div>
          {pointsSpent > 0 && (
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Usarás <strong>{pointsSpent} puntos</strong> por la recompensa
            </div>
          )}
        </div>

        {state.error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {state.error}
          </p>
        )}

        <input
          type="hidden"
          name="cart"
          value={JSON.stringify(
            items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              extraIds: i.extraIds,
            }))
          )}
        />

        <button
          type="submit"
          disabled={pending || items.length === 0}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Procesando…" : `Confirmar pedido · ${formatCOP(totals.total)}`}
        </button>

        <Link
          href="/carrito"
          className="mt-3 flex w-full items-center justify-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al carrito
        </Link>
      </aside>
    </form>
  );
}
