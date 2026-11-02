"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/actions";
import type { SafeUser } from "@/lib/types";

export function ProfileForm({ user }: { user: SafeUser }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, {});

  return (
    <form action={formAction} className="space-y-4">
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
        Nombre
        <input
          type="text"
          name="name"
          defaultValue={user.name}
          required
          className="mt-1 w-full rounded-xl border border-line bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <label className="block text-sm text-muted">
        Correo (no editable)
        <input
          type="email"
          value={user.email}
          disabled
          className="mt-1 w-full cursor-not-allowed rounded-xl border border-line bg-black/5 px-4 py-3 text-muted outline-none"
        />
      </label>

      <label className="block text-sm text-muted">
        Teléfono
        <input
          type="tel"
          name="phone"
          defaultValue={user.phone ?? ""}
          placeholder="Ej. 300 123 4567"
          className="mt-1 w-full rounded-xl border border-line bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <label className="block text-sm text-muted">
        Dirección de entrega
        <input
          type="text"
          name="address"
          defaultValue={user.address ?? ""}
          placeholder="Calle, carrera, barrio, ciudad"
          className="mt-1 w-full rounded-xl border border-line bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
