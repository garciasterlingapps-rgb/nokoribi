"use client";

import { useActionState, useEffect, useState } from "react";
import { updateRedemptionStatusAction } from "@/lib/actions";
import { REDEMPTION_STATUS_LABELS } from "@/lib/types";
import type { RedemptionStatus } from "@/lib/types";

const STATUSES: RedemptionStatus[] = ["PENDIENTE", "APLICADO", "CANCELADO"];

export function RedemptionStatusSelect({
  redemptionId,
  status,
}: {
  redemptionId: string;
  status: RedemptionStatus;
}) {
  const [, formAction, pending] = useActionState(updateRedemptionStatusAction, {});
  const [value, setValue] = useState<RedemptionStatus>(status);

  useEffect(() => {
    setValue(status);
  }, [status]);

  return (
    <form action={formAction}>
      <input type="hidden" name="redemptionId" value={redemptionId} />
      <select
        name="status"
        value={value}
        disabled={pending}
        onChange={(e) => {
          setValue(e.target.value as RedemptionStatus);
          e.currentTarget.form?.requestSubmit();
        }}
        className="rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {REDEMPTION_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
