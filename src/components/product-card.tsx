import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import type { Ingredient, Product } from "@/lib/types";
import { formatCOP } from "@/lib/money";
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

export function ProductCard({
  product,
}: {
  product: Product & { ingredients: Ingredient[] };
}) {
  return (
    <Link
      href={`/productos/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-accent-soft to-background">
        <ProductImage
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          fallback={
            <div className="flex h-full w-full items-center justify-center text-6xl">
              {CATEGORY_EMOJI[product.category] ?? "🍴"}
            </div>
          }
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
          {CATEGORY_LABEL[product.category] ?? product.category}
        </span>
        {product.is_pizza_del_mes === 1 && (
          <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">
            ⭐ Pizza del Mes
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-semibold leading-tight">
          {product.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted">
          {product.description}
        </p>
        {product.is_pizza_del_mes === 1 && (
          <p
            className={`mt-2 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              (product.stock ?? 0) > 0
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {(product.stock ?? 0) > 0
              ? `Quedan ${product.stock} disponibles`
              : "Agotada"}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-semibold text-accent">
            {formatCOP(product.base_price)}
          </span>
          <span className="text-sm font-medium text-foreground underline-offset-4 group-hover:underline">
            {product.is_builder === 1 ? "Armar" : "Agregar al carrito"}
          </span>
        </div>
      </div>
    </Link>
  );
}
