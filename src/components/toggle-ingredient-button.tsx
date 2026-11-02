"use client";

import { useActionState } from "react";
import { toggleIngredientActiveAction } from "@/lib/actions";

export function ToggleIngredientButton({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const [, formAction, pending] = useActionState(
    toggleIngredientActiveAction,
    {}
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
          active ? "bg-green-500" : "bg-gray-300"
        }`}
        aria-label={active ? "Desactivar" : "Activar"}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            active ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </form>
  );
}
