# Anabolic Kitchen (PWA) — MVP

## Ce primești în acest zip
- Proiect Next.js + Tailwind (dark premium)
- Auth (Supabase)
- Onboarding (calculator caloric + macro plan)
- Dashboard (azi: calorii + macros consumate/rămase)
- Biblioteca de rețete + detalii + „Adaugă azi”
- Ziua curentă (lista meselor adăugate)

## Cerințe
- Node.js 18+ (recomandat 20+)

## 1) Supabase
1. Creează proiect Supabase.
2. În SQL Editor rulează:
   - `supabase/schema.sql`
   - apoi `supabase/seed_recipes.sql`
3. În Project Settings -> API copiază:
   - Project URL
   - anon public key

## 2) Config local
1. În rădăcina proiectului:
   - copiază `.env.local.example` ca `.env.local`
   - completează `NEXT_PUBLIC_SUPABASE_URL` și `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3) Rulează aplicația
```bash
npm install
npm run dev
```
Deschide: http://localhost:3000

## Observații (MVP)
- Protecția e client-side (redirect la /login). Datele sunt totuși protejate prin RLS în Supabase.
- Paywall Stripe NU este inclus încă (îl adăugăm după ce confirmi că MVP-ul funcționează cap-coadă).


## Upgrade: Coach + Hybrid foods

1) Rulează `supabase/migrations/upgrade_coach_hybrid.sql` în Supabase SQL Editor.
2) Setează contul tău ca coach: `update public.profiles set is_coach=true where user_id='<UUID>';`
3) Deploy pe Vercel.
