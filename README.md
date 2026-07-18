# TwinMS

Your MS digital twin — an AI-powered companion for people living with multiple sclerosis.

A Vite + React app implementing the TwinMS Claude Design project:

- **`/login`** — sign-in screen with a patient/clinician role toggle (clinician view arrives in a later iteration). Mock auth: any password works, the email picks the demo patient.
- **`/dashboard/:patientId`** — the signed-in patient's dashboard. Unauthenticated visits redirect to `/login`; unknown patient ids redirect to your own dashboard.

## Dashboard

- **Overall status strip** — worst-of rollup across biomarkers and environment (NORMAL / MONITOR / REVIEW).
- **Biomarker trend** — 30-day serum NFL against fixed clinical bands, corroborated by GFAP tracked against the patient's personal baseline.
- **Environment** — local temperature with a heat advisory above the Uhthoff threshold (30 °C).
- **Medication** — dosing cycle progress ring with next-dose countdown and a calendar reminder.
- **Recommended next steps** — escalation card (MRI order, appointment, data export) that appears only when a marker enters the red zone.

TwinMS surfaces trends for specialist review. It does not diagnose relapses or recommend treatment.

## Running

```sh
npm install
cp .env.example .env
# Add your OPENAI_API_KEY to .env
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## OpenAI assistant

The dashboard assistant sends requests to the server-side `/api/assistant` proxy. Keep `OPENAI_API_KEY` in `.env`; it is never sent to the browser. Set `OPENAI_MODEL` in the same file to override the default model.

## Demo accounts

| Email | Patient | Profile |
| --- | --- | --- |
| `maya@twinms.app` | TW-0042 Maya Lindqvist | NFL trending elevated, Lisbon heat advisory, Ocrevus 6-monthly |
| `jonas@twinms.app` | TW-0117 Jonas Weber | All markers stable, Berlin, Kesimpta monthly |

Demo controls at the bottom of the dashboard: a temperature slider (drives the heat advisory) and a **simulate flare** toggle that pushes the latest NFL reading into the red zone, flipping the status strip to REVIEW and revealing the escalation card. Both are also settable via URL, e.g. `/dashboard/TW-0042?flare=1&temp=24`.

## Structure

| Path | Purpose |
| --- | --- |
| `src/styles/styleguide.css` | Design tokens — the only place to re-theme (brand layer + independent clinical-status layer) |
| `src/styles/app.css` | Component styles |
| `src/data/twinms-config.js` | Mock patients and per-patient thresholds — the UI reads everything from here |
| `src/auth.js` | Mock auth store (localStorage); swap for a real identity provider here |
| `src/pages/Login.jsx`, `src/pages/Dashboard.jsx` | Routes |
| `src/components/MarkerChart.jsx` | Banded 30-day trend chart |
