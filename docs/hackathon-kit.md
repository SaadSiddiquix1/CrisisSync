# Hackathon Kit

## One-Line Pitch

CrisisSync is an AI-native emergency coordination platform for hospitality venues that turns guest reports into realtime, explainable staff response.

## 30-Second Pitch

Hotels and resorts still handle emergencies through fragmented calls, hallway communication, and delayed coordination. CrisisSync gives guests a simple reporting flow, then uses Gemini to classify severity, generate instructions, and route the incident into a realtime responder and command-center workflow. The result is faster triage, better visibility, and a calmer response under pressure.

## 90-Second Demo Script

1. Start on the landing page.
   "CrisisSync is the incident operating system for hospitality venues. It turns guest confusion into structured, explainable response."

2. Open the website assistant.
   "Even the public website is guided, so a stressed guest still knows where to go next."

3. Open `/v/grand-meridian` and submit one guest report.
   Use a believable scenario with a location, severity, and optional photo.

4. Let the product route to the live guest status page.
   Call out:
   - AI severity
   - guest safety instructions
   - responder focus
   - live progress state

5. Open the staff dashboard.
   "The responder team sees the incident immediately and can claim it without losing context."

6. Open the admin dashboard.
   "The command center sees the same incident with AI reasoning, checklist context, retriage, and resolution controls."

7. Resolve the incident and open the generated report.
   "We end with a structured post-incident record, so this is not just triage. It is an operational loop."

## Judge-Friendly Talking Points

- This is not just a chatbot or classifier.
  It is an end-to-end operational workflow.

- Gemini is doing real work in the product.
  It provides triage, instructions, visual analysis, reasoning, and prevention recommendations.

- The system is designed for a real deployment environment.
  There are guest, staff, and admin surfaces with differentiated responsibilities.

- The demo is resilient.
  Even if the backend dataset is sparse, the app includes demo-safe operational fallback data.

## Canonical Demo Setup

- Seeded venue slug: `grand-meridian`
- Health check route: `/status`
- Golden report flow: `/v/grand-meridian`
- Golden staff flow: `/staff/dashboard`
- Golden admin flow: `/admin/dashboard`

## Fallback Script

If live AI or seeding is flaky:

1. Open `/status` and acknowledge the dependency issue directly.
2. Show the seeded or fallback incident already present in staff/admin dashboards.
3. Focus the story on explainable AI outputs, live coordination, and incident closure.
4. Close on why this is valuable for hospitality operations, not on the temporary outage.

## Problem

- Guests may panic and report incomplete information.
- Staff need actionable guidance immediately.
- Venue managers need a coordinated view across multiple incidents and responders.

## Solution

- Mobile-friendly incident intake
- Multimodal Gemini triage
- Realtime responder workflow
- Admin command and analytics layer
- Post-incident learning loop

## Innovation Highlights

- Multimodal emergency intake with image-aware triage
- Explainable AI outputs instead of black-box labels
- Customer-facing website assistant for guidance and conversion
- Premium UX normally missing from hackathon operations tooling

## If Asked “What Would You Build Next?”

- WhatsApp / SMS escalation
- Live voice reporting
- Multilingual guest reporting
- Floor-aware responder routing
- Integration with hotel PMS / incident systems
- Automated incident trend summaries for managers

## If Asked “Why Gemini?”

- Fast multimodal analysis
- Strong structured-response capability
- Useful for both guest guidance and operational intelligence
- Lets the product move beyond simple text classification into photo-aware triage and explainable reasoning
