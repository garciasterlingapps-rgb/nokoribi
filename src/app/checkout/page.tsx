import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPointsPerCop, getShippingCost } from "@/lib/settings";
import { getRewards } from "@/lib/data";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata = { title: "Finalizar pedido" };

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/ingresar?next=/checkout");
  }

  const rewards = await getRewards();
  const pointsPerCop = await getPointsPerCop();
  const shippingCost = await getShippingCost();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Finalizar pedido
      </h1>
      <p className="mt-1 text-muted">
        Hola, {user.name.split(" ")[0]}. Confirma los detalles de tu pedido.
      </p>
      <div className="mt-8">
        <CheckoutForm
          user={user}
          pointsPerCop={pointsPerCop}
          shippingCost={shippingCost}
          rewards={rewards}
        />
      </div>
      <p className="mt-8 text-center text-xs text-muted">
        ¿Necesitas cambiar tu dirección guardada?{" "}
        <Link href="/cuenta" className="underline-offset-2 hover:underline">
          Editar perfil
        </Link>
      </p>
    </div>
  );
}
