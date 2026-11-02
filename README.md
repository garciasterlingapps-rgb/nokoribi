# Nokoribi 🍕

Plataforma web de e-commerce y fidelización para un emprendimiento de **pizzas de masa madre congeladas** y **panadería congelable** (churros, cinnamon rolls, etc.).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (diseño responsive, marca "brasas")
- **SQLite** vía `node:sqlite` (integrado en Node 24, sin instalación ni servidor)
- **bcryptjs** para contraseñas, **zod** para validación, **lucide-react** para iconos

## Cómo ejecutar

```bash
npm install     # primera vez
npm run dev     # servidor de desarrollo → http://localhost:3000
```

Para producción:

```bash
npm run build
npm run start
```

## Credenciales de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@nokoribi.co` | `Nokoribi2026` |

> ⚠️ Cambia la contraseña del administrador antes de publicar (está definida en `src/lib/db.ts`).

## Qué incluye (MVP — Fase 0 + 1)

**Cliente**
- Catálogo de productos con filtro por categoría (Pizza / Panadería) e **imágenes reales**
- Detalle de producto con **personalización** (agregar ingredientes extra con precio en tiempo real)
- Carrito (persistido en el navegador)
- Registro / inicio de sesión / cierre de sesión (sesiones por cookie)
- Checkout (pago contra entrega / Nequi / transferencia)
- Historial de pedidos y **puntos acumulados** en "Mi cuenta"
- Confirmación de pedido con detalle
- **Catálogo de recompensas y canje de puntos** (`/recompensas`)

**Administrador** (`/admin`)
- Dashboard con métricas (ingresos, pedidos, clientes, top productos)
- Gestión de pedidos (cambiar estado)
- CRUD de productos (crear, editar, activar/desactivar)
- **Gestión de recompensas** (crear, editar, activar) y **atención de canjes** (aplicar/cancelar con devolución de puntos)
- **Configuración** de reglas de puntos y costo de envío desde el panel
- **Notificar por WhatsApp** al cliente al cambiar el estado del pedido (clic-to-chat)

**Reglas de negocio**
- **Puntos:** 1 punto por cada $1.000 COP (configurable en `/admin/configuracion`)
- **Envío:** $6.000 COP por defecto (configurable en `/admin/configuracion`)
- **Recompensas aplicables en el checkout:** descuento (%), producto gratis (crédito) y envío gratis
- Precios base: pizza personal $20.000 COP (pepperoni, vegetariana, lomo curado)

## Estructura

```
src/
  app/            # rutas (páginas + layouts)
  components/     # componentes reutilizables (client + server)
  lib/
    db.ts         # conexión SQLite, esquema y seed
    auth.ts       # sesiones y helpers de autenticación
    actions.ts    # server actions (auth, pedidos, admin)
    data.ts       # consultas de lectura
    types.ts      # tipos compartidos
    money.ts      # formateo de moneda/fechas
data/             # base de datos SQLite (generada, ignorada por git)
```

## Roadmap (próximas iteraciones)

- [x] Canje de puntos por recompensas (productos, descuentos, envío gratis)
- [x] Reglas de puntos configurables desde el panel
- [x] Aplicar recompensas en el checkout (descuentos, envío gratis y crédito)
- [x] Costo de envío configurable
- [x] Notificaciones por WhatsApp (clic-to-chat) al cambiar el estado del pedido
- [ ] Notificaciones automáticas por WhatsApp (API de WhatsApp Business Cloud)
- [ ] Combinaciones favoritas guardadas
- [ ] Pasarela de pago en línea (Wompi: Nequi, PSE, tarjetas)
- [ ] Reportes de ingresos/egresos exportables (CSV)
- [ ] Migración a PostgreSQL para producción

## Notas técnicas

- La base de datos se crea y se siembra automáticamente en `data/nokoribi.db` al primer arranque.
- `node:sqlite` devuelve filas con prototipo `null`; el helper `toPlain()` en `src/lib/db.ts` las convierte en objetos planos para poder pasarlas a componentes cliente.
- Se desactivaron las opciones experimentales `cacheComponents` y `partialPrefetching` en `next.config.ts` para mantener el comportamiento clásico del App Router (rutas dinámicas con autenticación por cookies).
