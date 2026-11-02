"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { saveRewardAction } from "@/lib/actions";
import type { Reward } from "@/lib/types";

export function RewardForm({ reward }: { reward?: Reward }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveRewardAction, {});

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

      {reward && <input type="hidden" name="id" value={reward.id} />}

      <label className="block text-sm text-muted">
        Nombre
        <input
          type="text"
          name="name"
          defaultValue={reward?.name}
          required
          className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <label className="block text-sm text-muted">
        Tipo
        <select
          name="type"
          defaultValue={reward?.type ?? "ENVIO_GRATIS"}
          className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="ENVIO_GRATIS">Envío gratis</option>
          <option value="DESCUENTO">Descuento (%)</option>
          <option value="PRODUCTO">Producto gratis</option>
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-muted">
          Costo en puntos
          <input
            type="number"
            name="costPoints"
            defaultValue={reward?.cost_points ?? 100}
            min={1}
            required
            className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <label className="block text-sm text-muted">
          Valor (% o COP)
          <input
            type="number"
            name="value"
            defaultValue={reward?.value ?? 0}
            min={0}
            required
            className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>

      <p className="text-xs text-muted">
        El "valor" es el % de descuento (DESCUENTO) o el monto máximo en COP
        (PRODUCTO). Para envío gratis se deja en 0.
      </p>

      <label className="block text-sm text-muted">
        Estado
        <select
          name="active"
          defaultValue={reward ? String(reward.active) : "1"}
          className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="1">Activa</option>
          <option value="0">Inactiva</option>
        </select>
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar recompensa"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/recompensas")}
          className="rounded-full border border-line bg-card px-6 py-3 font-medium transition-colors hover:bg-black/5"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
