"use client";
/* eslint-disable @next/next/no-img-element */

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { saveProductAction } from "@/lib/actions";
import type { Product } from "@/lib/types";

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveProductAction, {});
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [imgError, setImgError] = useState(false);

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

      {product && <input type="hidden" name="id" value={product.id} />}

      <label className="block text-sm text-muted">
        Nombre
        <input
          type="text"
          name="name"
          defaultValue={product?.name}
          required
          className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <label className="block text-sm text-muted">
        Descripción
        <textarea
          name="description"
          defaultValue={product?.description}
          required
          rows={3}
          className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-muted">
          Categoría
          <select
            name="category"
            defaultValue={product?.category ?? "PIZZA"}
            className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="PIZZA">Pizza</option>
            <option value="PANADERIA">Panadería</option>
          </select>
        </label>

        <label className="block text-sm text-muted">
          Precio base (COP)
          <input
            type="number"
            name="basePrice"
            defaultValue={product?.base_price ?? 20000}
            min={0}
            required
            className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-muted">
          Imagen (URL)
          <input
            type="text"
            name="imageUrl"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              setImgError(false);
            }}
            placeholder="https://... o /images/pizza.jpg"
            className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <p className="text-xs text-muted">
          Déjalo vacío para mostrar el ícono. Puedes pegar una URL o guardar un
          archivo en <code>public/images/</code> y escribir{" "}
          <code>/images/nombre.jpg</code>.
        </p>

        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt="Vista previa"
            onError={() => setImgError(true)}
            className="h-40 w-full rounded-xl border border-line object-cover"
          />
        ) : imageUrl ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            No se pudo cargar la imagen. Verifica la URL.
          </p>
        ) : null}
      </div>

      <label className="block text-sm text-muted">
        Estado
        <select
          name="active"
          defaultValue={product ? String(product.active) : "1"}
          className="mt-1 w-full rounded-xl border border-line bg-card px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="1">Activo</option>
          <option value="0">Inactivo</option>
        </select>
      </label>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar producto"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/productos")}
          className="rounded-full border border-line bg-card px-6 py-3 font-medium transition-colors hover:bg-black/5"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
