import Link from "next/link";
import { ArrowRight, Gift, Snowflake, Truck } from "lucide-react";
import { getProducts } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { ProductCard } from "@/components/product-card";
import { HeroCarousel } from "@/components/hero-carousel";

export default async function Home() {
  const products = await getProducts();
  const featured = products.slice(0, 6);
  const user = await getCurrentUser();

  return (
    <>
      {/* Carrusel */}
      <HeroCarousel />

      {/* Destacados */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Destacados
            </h2>
            <p className="mt-1 text-muted">
              Lo más pedido, listo para personalizar.
            </p>
          </div>
          <Link
            href="/productos"
            className="hidden text-sm font-medium text-accent underline-offset-4 hover:underline sm:block"
          >
            Ver todo
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section
        id="como-funciona"
        className="border-t border-line bg-card"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
            Cómo funciona
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: <Snowflake className="h-6 w-6" />,
                title: "1. Arma tu pedido",
                text: "Elige tu pizza, agrégale ingredientes extra y guarda tus combinaciones favoritas.",
              },
              {
                icon: <Truck className="h-6 w-6" />,
                title: "2. Preparamos y entregamos",
                text: "Preparamos tu pedido, lo empacamos al vacío y coordinamos la entrega a tu puerta.",
              },
              {
                icon: <Gift className="h-6 w-6" />,
                title: "3. Gana puntos",
                text: "Cada compra suma puntos que puedes canjear por descuentos, envío gratis y más.",
              },
            ].map((step) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                  {step.icon}
                </span>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA (solo para visitantes no logueados) */}
      {!user && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-foreground px-6 py-12 text-center text-background sm:px-12">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              ¿Tienes antojo?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-background/70">
              Crea tu cuenta, arma tu pizza ideal y empieza a acumular puntos desde
              tu primer pedido.
            </p>
            <Link
              href="/registro"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Crear cuenta gratis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
