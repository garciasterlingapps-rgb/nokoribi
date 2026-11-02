"use client";

import { useActionState, useState } from "react";
import { saveSettingsAction } from "@/lib/actions";
import { formatCOP } from "@/lib/money";

export function SettingsForm({
  pointsPerCop,
  shippingCost,
  gamePointsPerPizza,
}: {
  pointsPerCop: number;
  shippingCost: number;
  gamePointsPerPizza: number;
}) {
  const [state, formAction, pending] = useActionState(saveSettingsAction, {});
  const [preview, setPreview] = useState(pointsPerCop);

  const examplePoints = preview > 0 ? Math.floor(20000 / preview) : 0;

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          {state.success}
        </p>
      )}

      <label className="block text-sm text-muted">
        ¿Cuántos pesos COP equivalen a 1 punto?
        <input
          type="number"
          name="pointsPerCop"
          defaultValue={pointsPerCop}
          min={1}
          required
          onChange={(e) => setPreview(Number(e.target.value) || 0)}
          className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <div className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-accent">
        Ejemplo: con una compra de {formatCOP(20000)}, un cliente ganaría{" "}
        <strong>{examplePoints} puntos</strong>.
      </div>

      <label className="block text-sm text-muted">
        Costo de envío (COP)
        <input
          type="number"
          name="shippingCost"
          defaultValue={shippingCost}
          min={0}
          required
          className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <label className="block text-sm text-muted">
        Puntos por pizza en el juego (Pizza Catcher)
        <input
          type="number"
          name="gamePointsPerPizza"
          defaultValue={gamePointsPerPizza}
          min={0}
          required
          className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar configuración"}
      </button>
    </form>
  );
}
