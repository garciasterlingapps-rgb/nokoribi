"use client";

import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatCOP } from "@/lib/money";

export default function CartPage() {
  const { items, subtotal, setQuantity, remove } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent">
          <ShoppingBag className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold">
          Tu carrito está vacío
        </h1>
        <p className="mt-2 text-muted">
          Explora el catálogo y arma tu pizza ideal.
        </p>
        <Link
          href="/productos"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Ver productos <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Carrito
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex items-start gap-4 rounded-2xl border border-line bg-card p-4"
            >
              <div className="flex h-16 w-16 flex-none items-center justify-center rounded-xl bg-accent-soft text-3xl">
                {item.name.toLowerCase().includes("pizza") ? "🍕" : "🥐"}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{item.name}</h3>
                  <button
                    type="button"
                    onClick={() => remove(item.key)}
                    className="text-muted transition-colors hover:text-accent"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {item.extras.length > 0 && (
                  <p className="mt-1 text-sm text-muted">
                    +{" "}
                    {item.extras
                      .map((e) =>
                        e.quantity > 1 ? `${e.name} (x${e.quantity})` : e.name
                      )
                      .join(", ")}
                  </p>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-line">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.key, item.quantity - 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"
                      aria-label="Disminuir"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.key, item.quantity + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"
                      aria-label="Aumentar"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="font-semibold">
                    {formatCOP(item.unitPrice * item.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-line bg-card p-5">
          <h2 className="font-semibold">Resumen</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Productos</dt>
              <dd>{items.reduce((a, i) => a + i.quantity, 0)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <dt>Subtotal</dt>
              <dd>{formatCOP(subtotal)}</dd>
            </div>
            <p className="text-xs text-muted">
              El envío y los puntos se calculan al finalizar.
            </p>
          </dl>
          <Link
            href="/checkout"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Finalizar pedido <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
