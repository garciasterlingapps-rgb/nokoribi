"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { ArrowLeft, Check, Minus, Plus, ShoppingBag } from "lucide-react";
import type { Ingredient, Product } from "@/lib/types";
import { formatCOP } from "@/lib/money";
import { useCart } from "@/components/cart-provider";

export function ProductCustomizer({
  product,
  allIngredients,
}: {
  product: Product & { ingredients: Ingredient[] };
  allIngredients: Ingredient[];
}) {
  const { add } = useCart();
  const [selected, setSelected] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const extras = useMemo(
    () => allIngredients.filter((i) => i.extra_price > 0),
    [allIngredients]
  );
  const isPizza = product.category === "PIZZA";

  const extrasTotal = selected.reduce((acc, id) => {
    const ing = allIngredients.find((i) => i.id === id);
    return acc + (ing?.extra_price ?? 0);
  }, 0);
  const unitPrice = product.base_price + extrasTotal;
  const lineTotal = unitPrice * quantity;

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setAdded(false);
  };

  const handleAdd = () => {
    const chosenExtras = allIngredients
      .filter((i) => selected.includes(i.id))
      .map((i) => ({ id: i.id, name: i.name, extraPrice: i.extra_price }));

    add(
      {
        key: `${product.id}|${[...selected].sort().join(",")}`,
        productId: product.id,
        name: product.name,
        quantity: 1,
        basePrice: product.base_price,
        unitPrice,
        extraIds: [...selected],
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
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[8rem]">
                {isPizza ? "🍕" : "🥐"}
              </div>
            )}
          </div>
        </div>

        {/* Detalle */}
        <div>
          <span className="text-sm font-medium uppercase tracking-wide text-accent">
            {isPizza ? "Pizza" : "Panadería"}
          </span>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 text-muted">{product.description}</p>

          <div className="mt-5 text-3xl font-semibold text-accent">
            {formatCOP(unitPrice)}
          </div>

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
              <div className="mt-2 flex flex-wrap gap-2">
                {extras.map((i) => {
                  const isOn = selected.includes(i.id);
                  return (
                    <button
                      key={i.id}
                      type="button"
                      onClick={() => toggle(i.id)}
                      className={
                        isOn
                          ? "inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white"
                          : "inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm ring-1 ring-line transition-colors hover:bg-black/5"
                      }
                    >
                      {isOn && <Check className="h-3.5 w-3.5" />}
                      {i.name}
                      <span className={isOn ? "text-white/80" : "text-muted"}>
                        +{formatCOP(i.extra_price)}
                      </span>
                    </button>
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
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover sm:flex-none"
            >
              <ShoppingBag className="h-4 w-4" />
              {added ? "¡Agregado!" : `Agregar · ${formatCOP(lineTotal)}`}
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
