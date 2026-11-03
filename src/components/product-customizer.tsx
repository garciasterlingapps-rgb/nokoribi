"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import type { Ingredient, Product } from "@/lib/types";
import { formatCOP } from "@/lib/money";
import { useCart } from "@/components/cart-provider";
import { ProductImage } from "@/components/product-image";

const CATEGORY_EMOJI: Record<string, string> = {
  PIZZA: "🍕",
  PANADERIA: "🥐",
  UNTABLES: "🥣",
};

const CATEGORY_LABEL: Record<string, string> = {
  PIZZA: "Pizza",
  PANADERIA: "Panadería",
  UNTABLES: "Untable",
};

export function ProductCustomizer({
  product,
  allIngredients,
}: {
  product: Product & { ingredients: Ingredient[] };
  allIngredients: Ingredient[];
}) {
  const { add } = useCart();
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const extras = useMemo(
    () => allIngredients.filter((i) => i.extra_price > 0),
    [allIngredients]
  );
  const isPizza = product.category === "PIZZA";

  const extrasTotal = Object.entries(selected).reduce((acc, [id, qty]) => {
    const ing = allIngredients.find((i) => i.id === id);
    return acc + (ing?.extra_price ?? 0) * qty;
  }, 0);
  const unitPrice = product.base_price + extrasTotal;
  const lineTotal = unitPrice * quantity;
  const soldOut =
    product.is_pizza_del_mes === 1 && (product.stock ?? 0) <= 0;

  const changeQty = (id: string, delta: number) => {
    setSelected((prev) => {
      const next = { ...prev };
      const current = next[id] ?? 0;
      const val = current + delta;
      if (val <= 0) delete next[id];
      else next[id] = Math.min(val, 20);
      return next;
    });
    setAdded(false);
  };

  const handleAdd = () => {
    const extraIds: string[] = [];
    const chosenExtras: { id: string; name: string; extraPrice: number; quantity: number }[] = [];
    for (const [id, qty] of Object.entries(selected)) {
      const ing = allIngredients.find((i) => i.id === id);
      if (!ing) continue;
      for (let i = 0; i < qty; i++) extraIds.push(id);
      chosenExtras.push({ id: ing.id, name: ing.name, extraPrice: ing.extra_price, quantity: qty });
    }

    add(
      {
        key: `${product.id}|${extraIds.sort().join(",")}`,
        productId: product.id,
        name: product.name,
        quantity: 1,
        basePrice: product.base_price,
        unitPrice,
        extraIds,
        extras: chosenExtras,
      },
      quantity
    );
    setAdded(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/productos"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al catálogo
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Visual */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-accent-soft to-background">
            <ProductImage
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
              fallback={
                <div className="flex h-full w-full items-center justify-center text-[8rem]">
                  {CATEGORY_EMOJI[product.category] ?? "🍴"}
                </div>
              }
            />
          </div>
        </div>

        {/* Detalle */}
        <div>
          <span className="text-sm font-medium uppercase tracking-wide text-accent">
            {CATEGORY_LABEL[product.category] ?? product.category}
          </span>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 text-muted">{product.description}</p>

          <div className="mt-5 text-3xl font-semibold text-accent">
            {formatCOP(unitPrice)}
          </div>

          {product.is_pizza_del_mes === 1 && (
            <p
              className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                (product.stock ?? 0) > 0
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {(product.stock ?? 0) > 0
                ? `⭐ Pizza del Mes · Quedan ${product.stock} disponibles`
                : "⭐ Pizza del Mes · Agotada"}
            </p>
          )}

          {product.ingredients.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold">Incluye</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.ingredients.map((i) => (
                  <span
                    key={i.id}
                    className="rounded-full bg-card px-3 py-1 text-sm text-foreground ring-1 ring-line"
                  >
                    {i.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isPizza && extras.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold">Agregar ingredientes</p>
              <div className="mt-3 space-y-2">
                {extras.map((i) => {
                  const qty = selected[i.id] ?? 0;
                  return (
                    <div
                      key={i.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{i.name}</p>
                        <p className="text-xs text-muted">
                          {i.unit ? `+${formatCOP(i.extra_price)} por ${i.unit}` : `+${formatCOP(i.extra_price)}`}
                        </p>
                      </div>
                      <div className="flex flex-none items-center gap-1">
                        <button
                          type="button"
                          onClick={() => changeQty(i.id, -1)}
                          disabled={qty === 0}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-line transition-colors hover:bg-black/5 disabled:opacity-30"
                          aria-label={`Quitar ${i.name}`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                        <button
                          type="button"
                          onClick={() => changeQty(i.id, 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-hover"
                          aria-label={`Agregar ${i.name}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cantidad + agregar */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-line bg-card">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5"
                aria-label="Disminuir"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5"
                aria-label="Aumentar"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={soldOut}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              <ShoppingBag className="h-4 w-4" />
              {soldOut
                ? "Agotada"
                : added
                  ? "¡Agregado!"
                  : `Agregar · ${formatCOP(lineTotal)}`}
            </button>
          </div>

          {added && (
            <p className="mt-3 text-sm">
              Producto agregado.{" "}
              <Link href="/carrito" className="font-medium text-accent underline-offset-4 hover:underline">
                Ir al carrito →
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
