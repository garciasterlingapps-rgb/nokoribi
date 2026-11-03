# Nokoribi 🍕

Plataforma web de e-commerce y fidelización para un emprendimiento de **pizzas de masa madre congeladas**, **panadería congelable** y **untables artesanales**.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (diseño responsive, marca "brasas")
- **PostgreSQL** (Supabase) vía `pg`
- **bcryptjs** para contraseñas, **zod** para validación, **lucide-react** para iconos

## Cómo ejecutar

```bash
npm install     # primera vez
npm run dev     # servidor de desarrollo → http://localhost:3000
```

Antes de arrancar, crea un archivo `.env.local` con la conexión a la base de datos (ver `.env.example`):

```
DATABASE_URL=postgresql://...
```

Para producción:

```bash
npm run build
npm run start
```

## Estructura

```
src/
  app/            # rutas (páginas + layouts)
  components/     # componentes reutilizables (client + server)
  lib/
    db.ts         # conexión PostgreSQL (Supabase), esquema y seed
    auth.ts       # sesiones y helpers de autenticación
    actions.ts    # server actions (auth, pedidos, admin)
    data.ts       # consultas de lectura
    types.ts      # tipos compartidos
    money.ts      # formateo de moneda/fechas
```
