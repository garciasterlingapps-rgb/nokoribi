import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAllProductsForAdmin } from "@/lib/data";
import { ProductForm } from "@/components/product-form";

export const metadata = { title: "Editar producto" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const products = await getAllProductsForAdmin();
  const product = products.find((p) => p.id === id);

  if (!product) notFound();

  return (
    <div>
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <h2 className="mt-3 font-display text-2xl font-semibold">
        Editar: {product.name}
      </h2>
      <div className="mt-6">
        <ProductForm product={product} />
      </div>
    </div>
  );
}
