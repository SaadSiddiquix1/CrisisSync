# CrisisSync Setup

## 1) Run Supabase migration
- Open Supabase SQL editor.
- Run `supabase/migrations/001_saas_schema.sql`.
- Ensure tables and policies are created successfully.

## 2) Configure environment variables
- Copy `.env.local.example` to `.env.local`.
- Fill in Supabase, `SUPABASE_SERVICE_ROLE_KEY`, Gemini, Groq, app URL, and demo seed secret values.

## 3) Seed demo data
- Start the app.
- Call `POST /api/demo/seed` with header `x-demo-seed-secret: <DEMO_SEED_SECRET>`.
- This safely resets the canonical demo venue (`grand-meridian`) and recreates demo crises, updates, and reports.

## 4) Generate QR codes
- Use onboarding step 2 or admin dashboard “Generate QR Code”.
- Download PNG and place around demo guest areas.

## 5) Judge demo flow
- Open landing page and explain AI-native hospitality emergency coordination.
- Open `/v/<slug>` via QR URL and submit a guest report with a photo.
- Show `/report/[id]/status` first so judges see guest-facing AI guidance and live progress.
- Show staff dashboard receiving the incident and claiming it.
- Show admin dashboard detail view, retriage, and report generation.
- Open incident report viewer and print preview.
- Open `/status` to verify integration health.
