"use client";

import { useActionState } from "react";
import { Gift } from "lucide-react";
import { redeemRewardAction } from "@/lib/actions";

export function RedeemButton({
  rewardId,
  costPoints,
  canAfford,
}: {
  rewardId: string;
  costPoints: number;
  canAfford: boolean;
}) {
  const [state, formAction, pending] = useActionState(redeemRewardAction, {});

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="rewardId" value={rewardId} />
        <button
          type="submit"
          disabled={pending || !canAfford}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Gift className="h-4 w-4" />
          {pending
            ? "Canjeando…"
            : canAfford
              ? `Canjear por ${costPoints} pts`
              : "Puntos insuficientes"}
        </button>
      </form>

      {state.error && (
        <p className="mt-2 text-sm text-red-600">{state.error}</p>
      )}
      {state.success && (
        <p className="mt-2 text-sm text-green-700">{state.success}</p>
      )}
    </div>
  );
}
