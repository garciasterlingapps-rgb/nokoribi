import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { Plus } from "lucide-react";
import { getAllProductsForAdmin, getAllIngredientsForAdmin } from "@/lib/data";
import { formatCOP } from "@/lib/money";
import { ToggleProductButton } from "@/components/toggle-product-button";
import { IngredientPriceForm } from "@/components/ingredient-price-form";
import { ToggleIngredientButton } from "@/components/toggle-ingredient-button";

export const metadata = { title: "Productos" };

export default async function AdminProductsPage() {
  const products = await getAllProductsForAdmin();
  const ingredients = await getAllIngredientsForAdmin();

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            {products.length} producto(s) en total
          </p>
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" /> Nuevo producto
          </Link>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-black/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-10 w-10 flex-none rounded-lg object-cover ring-1 ring-line"
                        />
                      ) : (
                        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-accent-soft text-lg">
                          {p.category === "PIZZA" ? "🍕" : "🥐"}
                        </span>
                      )}
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.category === "PIZZA" ? "Pizza" : "Panadería"}
                  </td>
                  <td className="px-4 py-3">{formatCOP(p.base_price)}</td>
                  <td className="px-4 py-3">
                    <ToggleProductButton id={p.id} active={p.active === 1} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/productos/${p.id}`}
                      className="text-accent underline-offset-2 hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ingredientes (toppings) */}
      <div>
        <h2 className="font-display text-xl font-semibold">Ingredientes (toppings)</h2>
        <p className="mt-1 text-sm text-muted">
          Ajusta el precio extra de cada ingrediente y su disponibilidad.
        </p>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Ingrediente</th>
                <th className="px-4 py-3 font-medium">Precio extra</th>
                <th className="px-4 py-3 font-medium">Disponible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {ingredients.map((ing) => (
                <tr key={ing.id} className="hover:bg-black/[0.02]">
                  <td className="px-4 py-3 font-medium">{ing.name}</td>
                  <td className="px-4 py-3">
                    <IngredientPriceForm id={ing.id} price={ing.extra_price} />
                  </td>
                  <td className="px-4 py-3">
                    <ToggleIngredientButton
                      id={ing.id}
                      active={ing.available === 1}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
