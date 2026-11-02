"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/lib/actions";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, {});

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Crear cuenta
      </h1>
      <p className="mt-1 text-muted">
        Regístrate para hacer pedidos y ganar puntos en cada compra.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        {state.error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {state.error}
          </p>
        )}

        <label className="block text-sm text-muted">
          Nombre completo
          <input
            type="text"
            name="name"
            autoComplete="name"
            required
            className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <label className="block text-sm text-muted">
          Correo electrónico
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <label className="block text-sm text-muted">
          Contraseña
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={6}
            className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <label className="block text-sm text-muted">
          Teléfono (opcional)
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <label className="block text-sm text-muted">
          Dirección de entrega (opcional)
          <input
            type="text"
            name="address"
            autoComplete="street-address"
            className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/ingresar" className="font-medium text-accent hover:underline">
          Ingresar
        </Link>
      </p>
    </div>
  );
}
