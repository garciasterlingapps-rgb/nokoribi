import Link from "next/link";
import { Flame, AtSign } from "lucide-react";

const CURRENT_YEAR = 2026;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-card">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white">
                <Flame className="h-4 w-4" />
              </span>
              <span className="font-display text-lg font-semibold">Nokoribi</span>
            </div>
            <p className="mt-3 text-sm text-muted">
              Pizzas de masa madre y panadería artesanal, congeladas y empacadas
              al vacío para disfrutar cuando quieras.
            </p>
          </div>

          <div className="flex gap-10 text-sm">
            <div>
              <p className="font-semibold">Explorar</p>
              <ul className="mt-3 space-y-2 text-muted">
                <li><Link href="/productos" className="hover:text-foreground">Productos</Link></li>
                <li><Link href="/carrito" className="hover:text-foreground">Carrito</Link></li>
                <li><Link href="/cuenta" className="hover:text-foreground">Mi cuenta</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Sígueme</p>
              <ul className="mt-3 space-y-2 text-muted">
                <li>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground">
                    <AtSign className="h-4 w-4" /> Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-10 border-t border-line pt-6 text-xs text-muted">
          © {CURRENT_YEAR} Nokoribi. Hecho a mano, con masa madre.
        </p>
      </div>
    </footer>
  );
}
