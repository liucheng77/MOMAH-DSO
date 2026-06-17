# Demand & Supply Optimizer (DSO · AI_H_01) — Interactive Demo

An interactive, runnable demo of the **Demand & Supply Optimizer** agentic platform for the
Ministry of Municipalities & Housing (MOMAH) / Housing Support Agency. It shows **one platform
with three connected, agentic journeys** — all driven by the Orchestrator Agent.

Visual style matches the sibling `momah-demo` (Balady / MOMAH design system, Saudi green, RTL-ready).

## The three journeys (all reachable in one session as the Analyst)

- **J1 · Conversational Analysis** (`UC-01 → UC-02/03/04`)
  Ask in natural language → the Orchestrator interprets intent, **routes across engines**,
  carries **session memory**, and returns a Coverage-Mode-labelled, confidence-scored report.
  Includes the cross-engine highlight (a single follow-up chains the Balancing + Planning engines)
  and an **escalation guard** (vague / over-permission questions are declined, not answered).

- **J2 · Monitoring & Early Warning** (`UC-05 / UC-07`)
  The Data Quality Monitor scans 11 sources on a schedule. Run a scan to **auto-raise** a RED
  gap alert; each alert carries root-cause + severity and an **"Ask Orchestrator to analyze"**
  button that hands off straight into J1.

- **J3 · Policy Simulation** (`UC-06`)
  Define a policy (financing / white-land fee / subsidy) → the Policy Simulation Agent runs
  **3 scenarios** (optimistic / base / pessimistic) → ranked recommendations → **feed results to
  CoPilot (AI_H_04) & AI H-03**, closing the ecosystem loop (DSO as single source of truth).

A **connected demo path**: Hub → J2 raises a RED alert → "Ask Orchestrator" jumps to J1 →
cross-engine analysis + report → "Simulate a policy" hands off to J3 → feed the ecosystem.

## Features

- **Login** — Balady/MOMAH Single-Sign-On style page with a **role selector**.
- **Role switching** (BRD personas): **Housing Data Analyst** (full walkthrough), **Strategic
  Planning Manager**, **Senior Leadership** — each gets a different navigation set.
- **Language switching EN ⇄ العربية** with full **RTL** layout flip (toggle in the top bar or on login).
  A Chinese UI is also available for the team via `?ln=zh`.
- **Coverage Mode** switch (Ministry / Private / Total Market) in the top bar, reflected on reports.
- A live **Agent Activity** log strip along the bottom showing what each agent is doing.

## Run it

**Option ① — no install (for the demo):** double-click **`standalone.html`**. It loads React from a
CDN and runs in any modern browser.

**Option ② — Vite dev/build:**

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm run standalone # regenerate standalone.html from src/
npm test           # render smoke test (all pages × en/ar/zh)
```

## Project layout

```
demo-DSO/
├─ index.html               # Vite entry
├─ app.html                 # "how to open" helper page
├─ standalone.html          # double-click build (generated)
├─ src/
│  ├─ App.jsx               # entire app (data, i18n, login, journeys)
│  ├─ styles.css            # Balady/MOMAH design system + DSO additions
│  └─ main.jsx              # React entry
├─ scripts/build-standalone.mjs
├─ tests/smoke.mjs          # mocked-store render test
└─ assets/                  # logo, building photo, icons
```

> All figures are **synthetic demo data** anchored to the BRD V0.3 structure (10 use cases,
> 4 engines + Orchestrator, 11 data sources, 3 coverage modes). Nothing connects to live systems;
> the platform is presented as read-only and recommend-only by design.

## Add real brand images (optional)

Drop `logo.png` (MoMaH logo) and `building.jpg` (hero background) into `assets/` (already included
from the sibling demo). For the Vite build, also copy them to `public/assets/`. If missing, the
login page falls back to a built-in SVG skyline.
