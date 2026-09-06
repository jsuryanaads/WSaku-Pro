# WSaku Pro

Aplikasi manajemen keuangan pribadi multi-user.

## Stack
- React + Vite
- Tailwind CSS
- Lucide React
- Recharts
- Supabase Auth + PostgreSQL + RLS + Realtime

## Supabase
Set `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` pada environment lokal/deployment.
Schema database ada di `supabase/schema.sql`.

Jangan pernah memasukkan service role/secret key ke frontend.
