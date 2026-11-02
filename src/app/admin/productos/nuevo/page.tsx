import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/product-form";

export const metadata = { title: "Nuevo producto" };

export default function NewProductPage() {
  return (
    <div>
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <h2 className="mt-3 font-display text-2xl font-semibold">Nuevo producto</h2>
      <div className="mt-6">
        <ProductForm />
      </div>
    </div>
  );
}
