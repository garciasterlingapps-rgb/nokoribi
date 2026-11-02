import Link from "next/link";
import { Flame, LogOut, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { CartLink } from "@/components/cart-link";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white">
            <Flame className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Nokoribi
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium sm:flex">
          <Link
            href="/productos"
            className="rounded-full px-3 py-2 transition-colors hover:bg-black/5"
          >
            Productos
          </Link>
          <Link
            href="/recompensas"
            className="rounded-full px-3 py-2 transition-colors hover:bg-black/5"
          >
            Recompensas
          </Link>
          <Link
            href="/juego"
            className="rounded-full px-3 py-2 font-medium text-accent transition-colors hover:bg-black/5"
          >
            Jugar
          </Link>
          <Link
            href="/#como-funciona"
            className="rounded-full px-3 py-2 transition-colors hover:bg-black/5"
          >
            Cómo funciona
          </Link>
        </nav>

        <div className="flex items-center gap-1">
          <CartLink />

          {user ? (
            <>
              <Link
                href="/cuenta"
                className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors hover:bg-black/5"
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">Mi cuenta</span>
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="hidden rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:opacity-90 sm:inline-flex"
                >
                  Panel
                </Link>
              )}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-black/5"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/ingresar"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:opacity-90"
            >
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
