import { Settings } from "lucide-react";
import {
  getGameDailyMaxPoints,
  getGamePointsPerPizza,
  getPointsPerCop,
  getShippingCost,
} from "@/lib/settings";
import { SettingsForm } from "@/components/settings-form";

export const metadata = { title: "Configuración" };

export default async function AdminSettingsPage() {
  const pointsPerCop = await getPointsPerCop();
  const shippingCost = await getShippingCost();
  const gamePointsPerPizza = await getGamePointsPerPizza();
  const gameDailyMaxPoints = await getGameDailyMaxPoints();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Settings className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-2xl font-semibold">
            Configuración del negocio
          </h2>
          <p className="text-sm text-muted">
            Ajusta las reglas de puntos y otros parámetros.
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-card p-5">
        <h3 className="font-semibold">Reglas de puntos</h3>
        <p className="mt-1 text-sm text-muted">
          Define cuántos pesos equivalen a 1 punto del programa de fidelización.
        </p>
        <div className="mt-5">
          <SettingsForm
            pointsPerCop={pointsPerCop}
            shippingCost={shippingCost}
            gamePointsPerPizza={gamePointsPerPizza}
            gameDailyMaxPoints={gameDailyMaxPoints}
          />
        </div>
      </section>
    </div>
  );
}
