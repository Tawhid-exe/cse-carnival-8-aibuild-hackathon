# 03 — Tech Stack

## Summary

| Layer | Choice | Version pin | Why |
|---|---|---|---|
| Runtime | Node.js | `20.x` LTS | Stable, supported by Next.js + Express + Better Auth |
| Package manager | npm | bundled with Node | Zero extra install for judges |
| Frontend framework | Next.js | `14.x` (App Router) | Modern routing, RSC, middleware support, easy deploy |
| Frontend language | TypeScript | `5.x` | Type safety, shadcn generates TS by default |
| Styling | Tailwind CSS | `3.x` | Fast, no design overhead |
| UI components | shadcn/ui | latest | Polished, copy-paste components, owns the code |
| Backend framework | Express | `4.x` | Battle-tested, minimal, easy to reason about |
| Backend language | JavaScript (ESM) | Node 20 | Avoids TS build step in backend — faster scaffold |
| ODM | Mongoose | `8.x` | Standard MongoDB object mapper for Node |
| Database | MongoDB Atlas | M0 (free tier) | No local install, free, sufficient for demo |
| Auth | Better Auth | `@better-auth/*` latest | Modern self-hosted, MongoDB adapter, JWT plugin |
| JWT | jsonwebtoken | `9.x` (backend only) | Verifies BA-signed tokens |
| LLM provider | Groq | API (OpenAI-compatible) | Free tier, fast, supports tool calling |
| LLM model | `llama-3.3-70b-versatile` | — | Best Groq free-tier model for tool use |
| Process runner | concurrently | `8.x` | One `npm run dev` starts both |

## Rationale per choice

### Next.js (not Vite + React)
- App Router = file-based routing for our 7 pages
- Built-in middleware for route protection (`middleware.ts`)
- Easy Vercel deploy for bonus points
- RSC keeps agent chat client-side without complex config

### Express (not Fastify/Hono)
- Familiar to all hackathon judges
- Tiny surface, easy to read in code review
- No issues with CORS or middleware ordering

### MongoDB Atlas (not local MongoDB)
- Judge doesn't need to install mongod
- Free M0 tier is plenty for demo data
- Risk: requires internet + account creation. Mitigated by README walkthrough.

### Better Auth (not NextAuth/Clerk/Auth0)
- TS-first, modern, works in our exact stack
- Has MongoDB adapter (no separate auth DB needed)
- JWT plugin gives us the auth bridge to Express cleanly
- Self-hosted — no third-party dependency

### Groq (not OpenAI)
- Free tier, zero cost for full demo
- Llama 3.3 70b has solid tool-calling support
- OpenAI-compatible API → easy to swap to OpenAI later if needed

### Tailwind + shadcn/ui (not plain CSS / MUI / Chakra)
- Fastest path to polished UI
- shadcn owns the generated code (no vendor lock-in)
- Pre-built table, dialog, form components match our exact needs

### JavaScript (not TypeScript) on backend
- Avoids `tsconfig` + `tsx` + `tsc --watch` in another process
- Backend code is small enough that JSDoc + Mongoose typing is sufficient
- Saves ~10 min in scaffold time

## Things we deliberately skipped

- **NextAuth** — over-featured for our needs, harder to bridge to Express
- **Prisma** — Mongoose is more idiomatic for MongoDB; Prisma's MongoDB support is still maturing
- **Server Actions** — we want a clean REST API anyway; server actions would create a parallel non-API path
- **WebSockets** — over-engineered; polling/refetch on mutations is fine for demo
- **Rate limiting** — not in scoring, not worth the time
- **Caching layer** — explicitly the wrong choice; judges will penalize stale data
- **Docker** — adds setup friction for judges; not worth the bonus

## Dependency install commands (for reference)

**Backend:**
```bash
cd backend
npm install express mongoose cors dotenv morgan groq-sdk jsonwebtoken
```

**Frontend:**
```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
npm install better-auth
npx shadcn@latest init -d
npx shadcn@latest add button input dialog table card select textarea badge toast dropdown-menu
```

**Root:**
```bash
cd ..
npm install -D concurrently
```

## Risks per tech choice

| Choice | Risk | Mitigation |
|---|---|---|
| MongoDB Atlas | Judge can't / won't set up Atlas | README step-by-step; document fallback plan |
| Better Auth | New lib, version churn | Pin versions in package.json |
| Groq | Free-tier rate limits, occasional 429 | Retry with backoff in agent loop |
| shadcn | Generates TS components, must keep in sync | Commit `components/ui/*` to repo |
| Two processes | Judge might only run one | Root `npm run dev` runs both; README explicit |
