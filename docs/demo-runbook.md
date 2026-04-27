# Demo Runbook

## Pre-Demo Checklist

1. Open `/status`.
2. Confirm `Supabase`, `Gemini API`, and `Groq API` all show `Online`.
3. Seed the demo venue:

```bash
curl -X POST http://localhost:3000/api/demo/seed -H "x-demo-seed-secret: <DEMO_SEED_SECRET>"
```

4. Confirm the canonical venue slug is:

```text
grand-meridian
```

5. Keep these pages ready in separate tabs:

```text
/
/v/grand-meridian
/staff/dashboard
/admin/dashboard
```

## Demo Credentials

- Admin: `admin@crisissync.demo` / `DemoPass123!`
- Staff: `staff@crisissync.demo` / `DemoPass123!`

## Golden Live Demo

1. Landing page: explain the hospitality problem and product promise.
2. Public assistant: show guided navigation.
3. Guest report: submit one believable incident from `/v/grand-meridian`.
4. Guest status: show AI instructions and live progress.
5. Staff dashboard: claim the incident.
6. Admin dashboard: retriage or resolve the incident.
7. Incident report: open the generated report and finish on prevention insights.

## If Something Fails

- If `/api/demo/seed` fails:
  Use the built-in demo-safe dashboards and present a seeded/fallback incident instead of forcing a live intake.

- If Gemini is slow:
  Stay on the guest status page briefly, then continue the story with the incident already visible in staff/admin.

- If report generation is slow:
  Explain that the incident report is generated on demand, then finish with the admin incident detail and prevention narrative.

- If any service is offline in `/status`:
  Say it clearly, pivot to the existing operational flow, and keep the demo moving.
