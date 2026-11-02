"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Ingresar
      </h1>
      <p className="mt-1 text-muted">Accede a tu cuenta para hacer pedidos.</p>

      <form action={formAction} className="mt-8 space-y-4">
        {state.error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {state.error}
          </p>
        )}

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
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Ingresando…" : "Ingresar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-accent hover:underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
