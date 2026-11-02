"use client";

import { useActionState } from "react";
import { saveIngredientAction } from "@/lib/actions";

export function IngredientPriceForm({
  id,
  price,
}: {
  id: string;
  price: number;
}) {
  const [state, formAction, pending] = useActionState(saveIngredientAction, {});

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input
        type="number"
        name="extraPrice"
        defaultValue={price}
        min={0}
        className="w-24 rounded-lg border border-line bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "…" : "Guardar"}
      </button>
      {state.success && (
        <span className="text-xs text-green-600" title={state.success}>
          ✓
        </span>
      )}
      {state.error && (
        <span className="text-xs text-red-600" title={state.error}>
          !
        </span>
      )}
    </form>
  );
}
