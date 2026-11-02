import Link from "next/link";
import { getProducts } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import type { ProductCategory } from "@/lib/types";

export const metadata = { title: "Productos" };

const CATEGORIES: { value: ProductCategory | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "PIZZA", label: "Pizzas" },
  { value: "PANADERIA", label: "Panadería" },
];

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const products = await getProducts();

  const active = categoria && categoria !== "TODOS" ? categoria : "TODOS";
  const filtered =
    active === "TODOS"
      ? products
      : products.filter((p) => p.category === active);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Productos
          </h1>
          <p className="mt-1 text-muted">
            Pizzas de masa madre y panadería congelada.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={
                c.value === "TODOS"
                  ? "/productos"
                  : `/productos?categoria=${c.value}`
              }
              className={
                active === c.value
                  ? "rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
                  : "rounded-full border border-line bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5"
              }
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-muted">
          No hay productos en esta categoría.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
