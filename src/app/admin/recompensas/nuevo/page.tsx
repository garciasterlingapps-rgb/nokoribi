import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RewardForm } from "@/components/reward-form";

export const metadata = { title: "Nueva recompensa" };

export default function NewRewardPage() {
  return (
    <div>
      <Link
        href="/admin/recompensas"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <h2 className="mt-3 font-display text-2xl font-semibold">
        Nueva recompensa
      </h2>
      <div className="mt-6">
        <RewardForm />
      </div>
    </div>
  );
}
