# Study Maze — Frontend

Web interface for **Chip-Aware CP-RAG for ESP32 Technical Documentation**. React 19 + Vite + TypeScript + Tailwind CSS 4.

This repository is self-contained. It talks to the backend (a separate repository) only through its HTTP/JSON API.

## What it does

1. **Select your chip** — a required dropdown: ESP32, ESP32-S3, ESP32-C3, ESP32-C6, ESP32-S2. Choosing one shows a hardware badge (core architecture, Wi-Fi, Bluetooth, USB). The question box stays disabled until a chip is selected.
2. **Ask a question** — free text plus sample questions for the selected chip, in the same panel as the chip dropdown.
3. **Read and inspect**
   - **Grounded answer** with clickable citation tags; each opens its source, labelled `[Doc Title | Chip | Section]`.
   - **CP-RAG X-Ray** with three tabs:
     - *Attention & clusters* — per-chunk attention scores and the K-Means Direct-Assist / Indirect-Assist split.
     - *Entities & summaries* — extracted hardware entities, relations and the question-focused summary of each direct chunk.
     - *Prompt structure* — the Head (Direct) → Middle (Indirect + shuffled noise) → Tail (Direct) layout, and the raw prompt.

## Setup

Requires Node.js 20+.

```bash
npm install
cp .env.example .env
npm run dev
```

Open <http://localhost:5173>. The backend must be running and seeded.

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL of the backend, no trailing slash |

The backend only accepts browsers from origins listed in its `FRONTEND_ORIGIN` setting. The dev server is pinned to port 5173 to match the backend default; if you deploy this app elsewhere, add that URL to `FRONTEND_ORIGIN` in the backend's `.env`.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server on port 5173 |
| `npm run build` | Type-check and build to `dist/` |
| `npm run typecheck` | Type-check only |
| `npm run preview` | Serve the production build |

`dist/` is a static site and can be hosted anywhere. `VITE_API_BASE_URL` is read at build time.

## Layout

```
frontend/
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx                 The three-step page and its state
│   ├── api.ts                  The only module that calls the backend
│   ├── api-types.ts            Types of the backend's JSON (mirrors its schemas)
│   ├── index.css               Design tokens (light + dark) and base styles
│   ├── components/
│   │   ├── Shell.tsx           Header, API status, theme toggle
│   │   ├── AskPanel.tsx        Chip dropdown, hardware summary, question, samples
│   │   ├── AnswerCard.tsx      Step 3: answer, citations, sources
│   │   ├── XRay.tsx            Step 3: pipeline inspector tabs
│   │   ├── ui.tsx              Step card, tags, notices
│   │   └── icons.tsx
│   └── lib/                    useHealth.ts, useTheme.ts, format.ts
└── public/favicon.svg
```

## API contract

`src/api-types.ts` mirrors the backend's `app/schemas.py`. When the backend changes a field, update it there. To regenerate types from a running backend:

```bash
npx openapi-typescript http://localhost:8000/openapi.json -o src/openapi.d.ts
```

Endpoints used: `GET /api/health`, `GET /api/chips`, `POST /api/query`.
