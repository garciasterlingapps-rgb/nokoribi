import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Gift, LayoutDashboard, Package, Settings } from "lucide-react";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Panel de administración" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/ingresar");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Panel de administración
        </h1>
        <span className="text-sm text-muted">Hola, {admin.name.split(" ")[0]}</span>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2 border-b border-line pb-3">
        {[
          { href: "/admin", label: "Resumen", icon: <BarChart3 className="h-4 w-4" /> },
          { href: "/admin/pedidos", label: "Pedidos", icon: <Package className="h-4 w-4" /> },
          { href: "/admin/productos", label: "Productos", icon: <LayoutDashboard className="h-4 w-4" /> },
          { href: "/admin/recompensas", label: "Recompensas", icon: <Gift className="h-4 w-4" /> },
          { href: "/admin/configuracion", label: "Configuración", icon: <Settings className="h-4 w-4" /> },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5"
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}
