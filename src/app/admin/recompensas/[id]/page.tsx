import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAllRewardsForAdmin } from "@/lib/data";
import { RewardForm } from "@/components/reward-form";

export const metadata = { title: "Editar recompensa" };

export default async function EditRewardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rewards = await getAllRewardsForAdmin();
  const reward = rewards.find((r) => r.id === id);

  if (!reward) notFound();

  return (
    <div>
      <Link
        href="/admin/recompensas"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <h2 className="mt-3 font-display text-2xl font-semibold">
        Editar: {reward.name}
      </h2>
      <div className="mt-6">
        <RewardForm reward={reward} />
      </div>
    </div>
  );
}
