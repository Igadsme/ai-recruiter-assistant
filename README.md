# Imani Gad · AI Recruiter Assistant

A recruiter-facing, evidence-grounded decision-support system for Imani Gad's background. Recruiters can greet the assistant, inspect verified experience, request evidence, paste a job description, preview the résumé, and reach out — without the browser ever talking to Gemini.

## Architecture

```text
Recruiter
    ↓
AI Assistant UI  (React + Vite)
    ↓
Frontend API Client  (public candidate data + chat)
    ↓
Backend API  (Express + TypeScript)
    ├── Intent router            (skip LLM for hi / thanks / sensitive)
    ├── Hybrid retrieval         (keywords + TF-IDF + Gemini embeddings)
    ├── Claim verification       (structured claims + per-source checks)
    ├── Fit analysis             (evidence-backed JD matching)
    ├── PostgreSQL + pgvector    (sessions, analytics, document embeddings)
    └── Gemini Service           (server-side only)
```

Production uses a single Render web service: the API serves `frontend/dist` and `/api/*`. Attach PostgreSQL so conversations, analytics, and embeddings survive deploys.

## Recruiter journey

1. Open the assistant and say **hi** — a local greeting, no Gemini call.
2. Ask about a role such as **Shaw** — hybrid retrieval grounds the answer.
3. Click **View evidence** to inspect cited sources.
4. Paste a job description into **Fit** for coverage, missing tools, and hiring risks.
5. Open the **résumé** card to preview or download the PDF.
6. Use the footer **contact** CTA or in-chat contact prompt.

## Grounding pipeline

- **Intent router** classifies greetings, introductions, résumé, fit, proof, sensitive, and candidate questions. Conversational intents never hit Gemini.
- **Hybrid retrieval** combines keyword scoring, TF-IDF, and Gemini `gemini-embedding-001` vectors stored in pgvector (lexical fallback only in tests).
- **Structured claims** must look like `{ "text": "...", "sourceIds": ["experience:shaw"] }`. Each cited source is validated before the answer is returned.
- **Unsupported-claim detection** refuses answers when too many claims fail source checks.
- **Evaluation suite** covers 100+ questions across greeting, factual, fit, résumé, injection, and ambiguous categories (`backend/eval/questions.ts`).

## Technologies

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4
- **Backend:** Node.js 22, Express, Zod, Helmet, CORS, express-rate-limit, Pino, `pg`
- **AI:** Google Gemini API via `@google/genai` (chat + embeddings, server-side only)
- **Data:** PostgreSQL + pgvector (JSON files only when `DATABASE_URL` is unset / tests)
- **Tests:** Vitest, Supertest, Testing Library, Playwright
- **CI:** GitHub Actions (typecheck, tests, format, audit, secret scan, e2e)
- **Deploy:** Render (`render.yaml`)

## Project structure

```text
project/
├── frontend/          Recruiter UI (chat shell, evidence, fit, voice)
├── backend/           API, retrieval, Gemini, PostgreSQL, candidate data
├── e2e/               Playwright recruiter workflow
├── package.json
├── render.yaml
└── README.md
```

Candidate facts live only in `backend/src/data/candidate/`. The frontend loads public profile, brief, and contact details from `/api/candidate/*`.

## Install

Requires Node.js 22 and [pnpm](https://pnpm.io/).

```bash
corepack enable
pnpm install
```

## Configure

1. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Copy `.env.example` to `.env` in the project root.
3. Set `GEMINI_API_KEY`. Never put this key in frontend env vars or commit it.
4. For production-like persistence, set `DATABASE_URL` to a PostgreSQL instance with pgvector.

```bash
cp .env.example .env
```

Default chat model: `gemini-flash-lite-latest` (override with `GEMINI_MODEL`). Embedding model: `gemini-embedding-001`.

## Run locally

```bash
pnpm dev
```

Or separately:

```bash
pnpm dev:backend    # http://localhost:3001
pnpm dev:frontend   # http://localhost:5173
```

The Vite dev server proxies `/api` to the backend.

## Tests

```bash
pnpm test                 # backend + frontend unit tests
pnpm --filter backend test
pnpm --filter frontend test
pnpm test:e2e             # Playwright recruiter workflow
```

Backend tests mock Gemini. They do not require a real API key. Playwright mocks `/api/*` so the full recruiter path can run without credentials.

## Production build

```bash
pnpm build
NODE_ENV=production pnpm start
```

On boot the API runs SQL migrations, then warms Gemini embeddings into `documents`.

## Deploy to Render

1. Push this repository to GitHub.
2. Create a Blueprint from `render.yaml`, or a Node web service plus a PostgreSQL database.
3. Set environment variables (do not add `VITE_*` Gemini keys):

| Variable | Required | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | Server-side only |
| `DATABASE_URL` | Yes in production | Render Postgres connection string |
| `FRONTEND_URL` | Yes in production | Public site URL |
| `NODE_ENV` | Yes | `production` |
| `GEMINI_MODEL` | No | Default `gemini-flash-lite-latest` |
| `GEMINI_EMBEDDING_MODEL` | No | Default `gemini-embedding-001` |
| `PORT` | No | Render sets this |
| `LOG_LEVEL` | No | Default `info` |
| `ANALYTICS_KEY` | No | Protects `/api/analytics` |

Leave `VITE_API_URL` unset in production so the UI uses same-origin `/api`.

## Environment variables

See `.env.example`.

| Name | Where | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Backend | Google Gemini API key |
| `GEMINI_MODEL` | Backend | Chat model id |
| `GEMINI_EMBEDDING_MODEL` | Backend | Embedding model id |
| `DATABASE_URL` | Backend | PostgreSQL (+ pgvector) |
| `FRONTEND_URL` | Backend | Allowed CORS origin |
| `PORT` | Backend | API port (default `3001`) |
| `NODE_ENV` | Backend | `development` or `production` |
| `VITE_API_URL` | Frontend | Optional API origin; empty in production |

## API endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness check |
| `POST` | `/api/chat` | Ask the assistant |
| `POST` | `/api/conversations` | Create a conversation |
| `GET` | `/api/conversations/:id` | Fetch conversation history |
| `GET` | `/api/candidate/profile` | Profile and education |
| `GET` | `/api/candidate/experience` | Professional experience |
| `GET` | `/api/candidate/projects` | Personal projects |
| `GET` | `/api/candidate/skills` | Skills and activities |
| `GET` | `/api/candidate/brief` | Public recruiter brief |
| `POST` | `/api/fit` | Evidence-backed job match |
| `POST` | `/api/analytics/events` | Recruiter funnel events |

### `POST /api/chat`

```json
{
  "message": "Tell me about Shaw",
  "conversationId": "optional-uuid",
  "mode": "general"
}
```

Successful grounded replies include `sources`, `claims`, `verified`, and `followUps`. Greeting and small-talk intents return `conversational: true` without retrieval.

## Security

- Gemini keys stay on the server. Helmet, CORS, Zod validation, and chat rate limits wrap `/api`.
- Prompt-injection attempts are blocked before retrieval or Gemini.
- Untrusted recruiter text is wrapped before it is sent to the model.
- Sessions expire (`SESSION_TTL_MS`) and analytics prune after `DATA_RETENTION_DAYS`.
- CI fails on committed private keys and high-severity production dependency issues.

## Candidate data

Verified facts live in `backend/src/data/candidate/`. Update those files when the resume changes. The retrieval layer sends only relevant slices to Gemini, then stores embeddings in PostgreSQL.
