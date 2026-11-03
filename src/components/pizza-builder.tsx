"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import type { Ingredient, Product } from "@/lib/types";
import { formatCOP } from "@/lib/money";
import { useCart } from "@/components/cart-provider";
import { BASE_PIZZA_SPRITE, getToppingVisual } from "@/lib/toppings";
import type { ToppingVisual } from "@/lib/toppings";

function PizzaBase() {
  const [err, setErr] = useState(false);
  if (!err) {
    return (
      <img
        src={BASE_PIZZA_SPRITE}
        alt="Pizza base"
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setErr(true)}
        draggable={false}
      />
    );
  }
  return (
    <div className="absolute inset-0 flex items-center justify-center text-[9rem]">
      🍕
    </div>
  );
}

function ToppingSprite({ visual, name }: { visual: ToppingVisual; name: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return <span className="block text-center text-3xl">{visual.emoji}</span>;
  }
  return (
    <img
      src={visual.sprite}
      alt={name}
      className="block aspect-square w-full object-contain"
      onError={() => setErr(true)}
      draggable={false}
    />
  );
}

interface PlacedTopping {
  id: string;
  name: string;
  visual: ToppingVisual;
  positions: { x: number; y: number }[];
  quantity: number;
}

const TOPPING_COUNT = 10;
const TOPPING_SIZE = 14; // % del ancho de la pizza (uniforme para todos)

// Posiciones aleatorias dentro del círculo de la pizza, sin solaparse (% desde el centro).
function randomPositions(count: number): { x: number; y: number }[] {
  const drawn = TOPPING_SIZE;
  const maxRadius = 42;
  const minDist = drawn * 1.1;
  const positions: { x: number; y: number }[] = [];
  let attempts = 0;
  while (positions.length < count && attempts < 800) {
    attempts++;
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * maxRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const inside = radius + drawn / 2 <= 46;
    const noOverlap = positions.every(
      (p) => Math.hypot(p.x - x, p.y - y) >= minDist
    );
    if (inside && noOverlap) positions.push({ x, y });
  }
  return positions;
}

export function PizzaBuilder({
  product,
  allIngredients,
}: {
  product: Product;
  allIngredients: Ingredient[];
}) {
  const { add } = useCart();
  const [placed, setPlaced] = useState<PlacedTopping[]>([]);
  const [added, setAdded] = useState(false);

  const toppings = allIngredients.filter((i) => i.extra_price > 0);
  const selectedIds = placed.map((p) => p.id);

  const extrasTotal = placed.reduce((acc, p) => {
    const ing = allIngredients.find((i) => i.id === p.id);
    return acc + (ing?.extra_price ?? 0) * p.quantity;
  }, 0);
  const unitPrice = product.base_price + extrasTotal;

  const changeQty = (id: string, delta: number) => {
    setPlaced((prev) => {
      const existing = prev.find((p) => p.id === id);
      if (existing) {
        const qty = existing.quantity + delta;
        if (qty <= 0) return prev.filter((p) => p.id !== id);
        return prev.map((p) =>
          p.id === id ? { ...p, quantity: Math.min(qty, 20) } : p
        );
      }

      if (delta <= 0) return prev;

      const ing = allIngredients.find((i) => i.id === id);
      const visual = ing ? getToppingVisual(ing.name) : undefined;
      if (!ing || !visual) return prev;

      const positions = randomPositions(TOPPING_COUNT);
      return [...prev, { id, name: ing.name, visual, positions, quantity: 1 }];
    });
    setAdded(false);
  };

  const handleAdd = () => {
    const extraIds: string[] = [];
    const chosen: { id: string; name: string; extraPrice: number; quantity: number }[] = [];
    for (const p of placed) {
      const ing = allIngredients.find((i) => i.id === p.id);
      if (!ing) continue;
      for (let i = 0; i < p.quantity; i++) extraIds.push(p.id);
      chosen.push({ id: ing.id, name: ing.name, extraPrice: ing.extra_price, quantity: p.quantity });
    }
    add({
      key: `custom|${[...selectedIds].sort().join(",")}`,
      productId: product.id,
      name: product.name,
      quantity: 1,
      basePrice: product.base_price,
      unitPrice,
      extraIds,
      extras: chosen,
    });
    setAdded(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
      <Link
        href="/productos"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al catálogo
      </Link>

      <div className="mt-4 lg:grid lg:grid-cols-2 lg:gap-10">
        {/* Pizza (sticky arriba en móvil) */}
        <div className="sticky top-16 z-20 -mx-4 border-b border-line bg-background/95 px-4 py-3 backdrop-blur lg:static lg:z-auto lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
          <div className="lg:flex lg:flex-col lg:items-center">
            <div className="relative mx-auto aspect-square w-32 overflow-hidden rounded-full border-[3px] border-line bg-gradient-to-br from-amber-100 to-orange-200 shadow-inner lg:mx-auto lg:w-full lg:max-w-md lg:border-4">
              <PizzaBase />
              {placed.map((p) =>
                p.positions.map((pos, idx) => (
                  <div
                    key={`${p.id}-${idx}`}
                    className="animate-topping-pop absolute"
                    style={{
                      left: `calc(50% + ${pos.x}%)`,
                      top: `calc(50% + ${pos.y}%)`,
                      width: `${TOPPING_SIZE}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <ToppingSprite visual={p.visual} name={p.name} />
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 lg:mt-4 lg:w-full lg:max-w-md">
              <p className="text-center text-xs text-muted lg:text-sm">
                {placed.length === 0
                  ? "Elige tus ingredientes 👇"
                  : `${placed.reduce((s, p) => s + p.quantity, 0)} porción(es) agregadas`}
              </p>
              <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3 lg:px-5 lg:py-4">
                <div>
                  <p className="text-xs text-muted">Total</p>
                  <p className="text-xl font-semibold text-accent lg:text-2xl">
                    {formatCOP(unitPrice)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={placed.length === 0}
                  className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-accent px-4 py-2.5 font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40 lg:px-5 lg:py-3"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {added ? "¡Agregado!" : "Agregar al carrito"}
                  </span>
                  <span className="sm:hidden">
                    {added ? "¡Listo!" : "Agregar"}
                  </span>
                </button>
              </div>
              {added && (
                <p className="mt-2 text-center text-sm">
                  <Link
                    href="/carrito"
                    className="font-medium text-accent underline-offset-4 hover:underline"
                  >
                    Ir al carrito →
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Ingredientes */}
        <div className="mt-4 lg:mt-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-sm text-muted lg:text-base">
            {product.description}
          </p>
          <p className="mt-2 text-xs text-muted lg:text-sm">
            Base (masa madre + salsa + queso):{" "}
            <span className="font-medium text-foreground">
              {formatCOP(product.base_price)}
            </span>
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:mt-5">
            {toppings.map((ing) => {
              const placedTop = placed.find((p) => p.id === ing.id);
              const qty = placedTop?.quantity ?? 0;
              const visual = getToppingVisual(ing.name);
              return (
                <div
                  key={ing.id}
                  className={
                    qty > 0
                      ? "flex flex-col items-center gap-1 rounded-2xl border-2 border-accent bg-accent-soft p-3 text-center transition-all"
                      : "flex flex-col items-center gap-1 rounded-2xl border border-line bg-card p-3 text-center transition-all"
                  }
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-2xl">
                    {visual?.emoji ?? "➕"}
                  </span>
                  <span className="text-xs font-medium leading-tight">
                    {ing.name}
                  </span>
                  <span className="text-xs text-accent">
                    {ing.unit
                      ? `+${formatCOP(ing.extra_price)} / ${ing.unit}`
                      : `+${formatCOP(ing.extra_price)}`}
                  </span>
                  <div className="mt-1 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => changeQty(ing.id, -1)}
                      disabled={qty === 0}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-line transition-colors hover:bg-black/5 disabled:opacity-30"
                      aria-label={`Quitar ${ing.name}`}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeQty(ing.id, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-hover"
                      aria-label={`Agregar ${ing.name}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
