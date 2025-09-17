
# Raspay App (Next.js + Supabase)

## Setup
1. Copiá `.env.local.example` a `.env.local` y poné tus claves:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
2. Instalar y correr:
```
npm install
npm run dev
```

## Rutas
- `/` Juego
- `/login`
- `/admin` (rol admin)
- `/cashier` (rol cashier)

> Requiere enum `app_role`, tabla `profiles` y RPCs `admin_grant_to_cashier`, `cashier_grant_to_user` ya creados en tu Supabase.
