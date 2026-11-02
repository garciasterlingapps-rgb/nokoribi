import { notFound } from "next/navigation";
import { getProduct, getAllIngredients } from "@/lib/data";
import { ProductCustomizer } from "@/components/product-customizer";
import { PizzaBuilder } from "@/components/pizza-builder";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  return { title: product?.name ?? "Producto" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  const allIngredients = await getAllIngredients();

  if (!product) notFound();

  if (product.is_builder === 1) {
    return <PizzaBuilder product={product} allIngredients={allIngredients} />;
  }

  return <ProductCustomizer product={product} allIngredients={allIngredients} />;
}
