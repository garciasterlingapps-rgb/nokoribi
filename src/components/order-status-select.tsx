"use client";

import { useActionState, useEffect, useState } from "react";
import { updateOrderStatusAction } from "@/lib/actions";
import { ORDER_STATUSES, STATUS_LABELS } from "@/lib/types";
import type { OrderStatus } from "@/lib/types";

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [, formAction, pending] = useActionState(updateOrderStatusAction, {});
  const [value, setValue] = useState<OrderStatus>(status);

  // Sincroniza el valor si cambia desde el servidor (revalidación).
  useEffect(() => {
    setValue(status);
  }, [status]);

  return (
    <form action={formAction}>
      <input type="hidden" name="orderId" value={orderId} />
      <select
        name="status"
        value={value}
        disabled={pending}
        onChange={(e) => {
          setValue(e.target.value as OrderStatus);
          e.currentTarget.form?.requestSubmit();
        }}
        className="rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
