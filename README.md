# Imani Gad · AI Recruiter Assistant

A recruiter-facing AI assistant that answers questions about Imani Gad's education, experience, skills, projects, and career story. The UI comes from a Figma Make frontend; this repository adds a production backend, grounded Gemini answers, and Render deployment.

Recruiters interact with the existing dark-mode chat experience. The browser never talks to Gemini directly.

## Architecture

```text
Recruiter
    ↓
AI Assistant UI  (React + Vite, Figma frontend)
    ↓
Frontend API Client
    ↓
Backend API  (Express + TypeScript)
    ├── Candidate Knowledge Base
    ├── Retrieval Layer
    ├── Conversation Manager
    └── Gemini Service
             ↓
        Gemini API
```

Production uses a single Render web service: the API serves the built frontend from `frontend/dist` and exposes `/api/*`.

## Technologies

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4
- **Backend:** Node.js 22, Express, Zod, Helmet, CORS, express-rate-limit, Pino
- **AI:** Google Gemini API via `@google/genai` (server-side only)
- **Tests:** Vitest, Supertest, Testing Library
- **Deploy:** Render (`render.yaml`)

## Project structure

```text
project/
├── frontend/          Figma-based UI
├── backend/           API, retrieval, Gemini, candidate data
├── package.json
├── render.yaml
└── README.md
```

## Install

Requires Node.js 22 and [pnpm](https://pnpm.io/).

```bash
corepack enable
pnpm install
```

## Configure Gemini

1. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Copy `.env.example` to `.env` in the project root.
3. Set `GEMINI_API_KEY`. Never put this key in frontend env vars or commit it.

```bash
cp .env.example .env
```

## Run locally

Start both apps:

```bash
pnpm dev
```

Or start them separately:

```bash
pnpm dev:backend    # http://localhost:3001
pnpm dev:frontend   # http://localhost:5173
```

The Vite dev server proxies `/api` to the backend, so the UI can call `/api/chat` on the same origin.

## Tests

```bash
pnpm test
```

Backend tests mock Gemini. They do not require a real API key.

```bash
pnpm --filter backend test
pnpm --filter frontend test
```

## Production build

```bash
pnpm build
NODE_ENV=production pnpm start
```

The backend then serves `frontend/dist` and the API together.

## Deploy to Render

1. Push this repository to GitHub.
2. In Render, create a new **Blueprint** from `render.yaml`, or create a Node web service with:
   - **Build:** `pnpm install && pnpm --filter frontend build && pnpm --filter backend build`
   - **Start:** `pnpm --filter backend start`
   - **Health check:** `/api/health`
3. Set environment variables (do not add `VITE_*` Gemini keys):

| Variable | Required | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | Server-side only |
| `FRONTEND_URL` | Yes in production | Public site URL, e.g. `https://your-service.onrender.com` |
| `NODE_ENV` | Yes | `production` |
| `GEMINI_MODEL` | No | Default `gemini-2.5-flash` |
| `PORT` | No | Render sets this automatically |
| `LOG_LEVEL` | No | Default `info` |

The Gemini API key must never be exposed to the browser. Leave `VITE_API_URL` unset in production so the UI uses same-origin `/api`.

## Environment variables

See `.env.example`.

| Name | Where | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Backend | Google Gemini API key |
| `GEMINI_MODEL` | Backend | Model id |
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

### `POST /api/chat`

```json
{
  "message": "Tell me about this candidate.",
  "conversationId": "optional-uuid",
  "mode": "general"
}
```

`mode` is `"general"` or `"recruiter"`. Recruiter mode asks Gemini for tighter, hiring-oriented answers.

```json
{
  "message": "Imani Gad is a Computer Science student...",
  "sections": [{ "label": "SOFTWARE ENGINEERING", "body": "...", "tags": ["Python"], "metrics": ["+15% throughput"] }],
  "sources": [{ "type": "experience", "title": "Software Engineering Intern", "organization": "UpCancer" }],
  "conversationId": "...",
  "isResume": false
}
```

Chat is rate-limited by IP. Requests are validated with Zod. Gemini errors are returned as safe user-facing messages, never as raw provider errors.

## Candidate data

Verified facts live in `backend/src/data/candidate/`. Update those files when the resume changes. The retrieval layer sends only relevant slices to Gemini so answers stay grounded.
