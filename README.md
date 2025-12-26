# AI Chat — Mini AI Live Chat Agent (Spur take‑home)

**Short:** A minimal full‑stack chat app (React frontend + Node + TypeScript backend) that persists conversations in PostgreSQL and generates replies using an LLM (Groq/OpenAI-compatible). This project follows the Spur Founding Full‑Stack Engineer take‑home assignment.

---

## 🚀 Quick highlights

- **Backend:** Node.js + TypeScript (Express)
- **Frontend:** React + Vite
- **Database:** PostgreSQL (migrations included)
- **Cache (optional):** Redis
- **LLM:** Groq (OpenAI-compatible) via the `openai` client
- **Key endpoints:** `POST /chat/message`, `GET /chat/history`

---

## 🧭 Getting started (local development)

Prereqs
- Node.js (16+)
- PostgreSQL
- Optional: Redis (if you want caching)

Steps
1. Clone the repo:
   - git clone <repo-url>
   - cd ai-chat
2. Install dependencies
   - cd apps/server && npm install
   - cd ../web && npm install
3. Copy environment templates
   - cp apps/server/.env.example apps/server/.env
   - cp apps/web/.env.example apps/web/.env (optional)
   - Edit `.env` values (DATABASE_URL, GROQ_API_KEY / OPENAI_API_KEY, REDIS_* if used)
4. Run DB migrations
   - cd apps/server
   - npm run migrate
5. Start backend (dev)
   - npm run dev
6. Start frontend (dev)
   - cd ../web
   - npm run dev
7. Open the UI (Vite default): http://localhost:5173 (ensure `VITE_API_BASE_URL` points to backend)

> Note: The frontend stores session id in `localStorage` under key `spur.sessionId`.

---

## 🔐 Environment variables

Use `.env` (do not commit). Key variables:

- `PORT` (default: 8080)
- `DATABASE_URL` (Postgres connection string)
- `GROQ_API_KEY` or `OPENAI_API_KEY` (LLM; set via env)
- `REDIS_ENABLED` ("true"/"false")
- `REDIS_URL`
- `VITE_API_BASE_URL` (frontend dev -> backend URL)

Security note: this repo includes `apps/server/.env.example`. Do NOT commit secrets; `.gitignore` already excludes `apps/server/.env` and `apps/web/.env`.

---

## 📦 Database & migrations

Migrations live in `apps/server/src/db/migrations/`.

Run them with:

- cd apps/server
- npm run migrate

Current schema (summary):
- `conversations` (id: uuid, created_at)
- `messages` (id, conversation_id, sender: enum('user','ai'), text, created_at)

No seed script is required: agent FAQ/domain knowledge is embedded in the system prompt.

---

## 🔌 API reference

POST /chat/message
- Body: `{ message: string, sessionId?: string }`
- Validations: non-empty message, max length enforced (zod schema)
- Response: `{ reply: string, sessionId: string }`
- Flow: validate → create/get conversation → persist user message → call LLM → persist AI reply → return reply & sessionId

GET /chat/history?sessionId=<uuid>
- Response: `{ sessionId, messages: [{ sender, text }] }`
- Histories are cached in Redis (short TTL) if configured.

Rate limiting: `POST /chat/message` is limited to 20 requests/min per IP via `express-rate-limit`.

---

## 🗂️ Architecture & structure

High level
- `apps/server/src`
  - `index.ts` — Express bootstrap
  - `chat/` — `chat.routes.ts`, `chat.schema.ts`, `chat.service.ts` (routes → services → db/llm)
  - `llm/` — `openai.ts` (client), `prompt.ts` (system prompt)
  - `db/` — `pool.ts`, `migrate.ts`, `migrations/`
  - `redis/` — optional cache client
  - `middleware/` — rate limiting, error handling

- `apps/web/src`
  - `Chat.tsx` — chat widget UI (message list, input, send)
  - `api.ts` — helper functions to call backend

Design choices
- Clean separation of concerns (routes → services → adapters)
- LLM interaction encapsulated in `src/llm/` so provider or model can be swapped easily
- Short Redis TTL for history caching to balance freshness vs. DB load
- Prompt hardcoded in `SYSTEM_PROMPT` for deterministic FAQ responses

---

## 🤖 LLM & Prompt notes

Provider & client
- The code uses the official `openai` NPM client configured for a Groq/OpenAI-compatible endpoint (see `apps/server/src/llm/openai.ts`).
- Model used: `llama-3.3-70b-versatile` (configured in code)
- Request options: `temperature: 0.2`, `max_tokens: 300` (keeps replies concise and cost-bounded)

Prompt
- System prompt (see `apps/server/src/llm/prompt.ts`):
  - "You are a helpful support agent for a small e-commerce store. Answer clearly and concisely." + simple FAQ (shipping, returns, support hours).
- Conversation history is included in the LLM call for context.

Error handling
- LLM failures are caught and translated to friendly messages (rate limits, auth errors, generic failure), so the UI shows a clear error message instead of crashing.

---

## ✅ Robustness & validation

- Input validated with `zod` (no empty messages, max length)
- Rate limiting on message endpoint (20 req/min per IP)
- Redis optional; app continues without it
- Error handler ensures server responds with structured errors and logs server-side failures

---

## 📋 Conformance checklist (to the Spur spec)

- Chat UI: ✅ scrollable, message separation, Enter to send, disabled while loading, typing indicator
- Backend API: ✅ `POST /chat/message` and `GET /chat/history` implemented; messages are persisted
- LLM Integration: ✅ external LLM used via env var; prompt + history sent; errors handled
- FAQ: ✅ FAQ seeded in system prompt (shipping/returns/support hours)
- Data model: ✅ conversations & messages persisted and retrievable
- Robustness: ✅ input validation, rate limiting, LLM error handling

---

## 🧭 If I had more time / future improvements

- Add E2E tests (Playwright/Cypress) and integration tests
- Add CI (lint, test, migrations check) and a deployment guide
- Move FAQ/knowledge into DB or a retrieval layer (RAG) for richer, updateable domain knowledge
- Support streaming LLM responses for better UX
- Add monitoring/alerts and usage/cost tracking for LLM calls

---

## 🧾 Example usage (curl)

Send a message:

```bash
curl -X POST http://localhost:8080/chat/message \ 
  -H 'Content-Type: application/json' \ 
  -d '{"message":"What is your return policy?"}'
```

Fetch history:

```bash
curl 'http://localhost:8080/chat/history?sessionId=<uuid>'
```

---

If you'd like, I can:
- open a PR that adds this README to `main`
- add a small pre-commit hook to prevent committing `.env` files
- add basic tests for the chat service

Feel free to tell me which follow-up you want me to take next. Cheers!
