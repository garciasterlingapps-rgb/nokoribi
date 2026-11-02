import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink, buildOrderStatusMessage } from "@/lib/whatsapp";
import { STATUS_LABELS } from "@/lib/types";
import type { OrderStatus } from "@/lib/types";

// Botón (enlace clic-to-chat) que abre WhatsApp con el mensaje de estado del
// pedido pre-escrito, listo para enviar al cliente.
export function WhatsAppNotifyButton({
  phone,
  customerName,
  orderId,
  status,
}: {
  phone: string | null;
  customerName: string;
  orderId: string;
  status: OrderStatus;
}) {
  if (!phone) return null;

  const message = buildOrderStatusMessage({
    customerName,
    orderId,
    statusLabel: STATUS_LABELS[status],
    status,
  });

  return (
    <a
      href={buildWhatsAppLink(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      title="Notificar por WhatsApp"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white transition-colors hover:bg-green-700"
    >
      <MessageCircle className="h-4 w-4" />
    </a>
  );
}
