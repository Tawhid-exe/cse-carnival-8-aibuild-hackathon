# 02 — Architecture

## System diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          Browser (port 3000)                             │
│                                                                          │
│   Next.js App                                                            │
│   ┌────────────────────────┐    ┌────────────────────────┐                │
│   │  Dashboard Pages       │    │  Agent Chat Page       │                │
│   │  /schedule /rooms ...  │    │  /agent                │                │
│   └──────────┬─────────────┘    └──────────┬─────────────┘                │
│              │ fetch + Bearer JWT          │ POST /api/agent/chat        │
│              ▼                             ▼                             │
│   ┌────────────────────────────────────────────────────────────┐          │
│   │  lib/api.ts — typed fetch wrappers, attaches session JWT  │          │
│   └────────────────────────────────────────────────────────────┘          │
│              │                                                             │
│   ┌──────────▼─────────────────────────────────────────────────┐          │
│   │  app/api/auth/[...all]/route.ts  (Better Auth catch-all)   │          │
│   └────────────────────────────────────────────────────────────┘          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │ Authorization: Bearer <jwt>
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        Backend (port 4000)                               │
│                                                                          │
│   Express                                                                 │
│   ┌────────────────────────────────────────────────────────────┐          │
│   │  app.use("/api", requireAuth)   ← gates every API route    │          │
│   └────────────────────────────────────────────────────────────┘          │
│   ┌────────────────────────────────────────────────────────────┐          │
│   │  Routes                                                    │          │
│   │   /schedules /rooms /events /announcements /assignments    │          │
│   │   /agent/chat                                              │          │
│   └──────────┬─────────────────────────────────┬───────────────┘          │
│              │ CRUD                              │ agent                   │
│   ┌──────────▼──────────────┐         ┌─────────▼──────────────┐          │
│   │  Mongoose models        │         │  Agent loop            │          │
│   │  Schedule Room Event    │         │  Groq LLM (tool calls) │          │
│   │  Announcement Assignment│         │  Tool executor → fetch │          │
│   └──────────┬──────────────┘         │  same /api routes      │          │
│              │                        └────────────────────────┘          │
└──────────────┼─────────────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       MongoDB Atlas (cloud)                              │
│                                                                          │
│   Collections:                                                           │
│     users, sessions     ← Better Auth                                     │
│     schedules, rooms, events, announcements, assignments  ← app data      │
└──────────────────────────────────────────────────────────────────────────┘
```

## Data flow

**Dashboard read (e.g. load schedule page):**
1. Next.js page mounts → `getSchedules()` from `lib/api.ts`
2. `lib/api.ts` adds `Authorization: Bearer <jwt>` from session
3. Express `requireAuth` middleware verifies JWT, attaches `req.user`
4. Route handler queries Mongoose, returns JSON
5. UI renders table; updates trigger refetch

**Dashboard write (e.g. add announcement):**
1. Form submit → `createAnnouncement(payload)`
2. Backend route validates, inserts, returns new record
3. UI refetches list, new record appears

**Agent query (e.g. "What's my next class?"):**
1. User sends message in `/agent` page
2. Frontend `POST /api/agent/chat { messages }` with Bearer JWT
3. Express verifies JWT, attaches `req.user` (id, email, name, student_id)
4. Agent loop:
   - Call Groq with system prompt + tools + messages
   - If Groq returns `tool_calls`, executor maps each to a backend route and `fetch`es it
   - Append tool results to messages
   - Re-call Groq
   - Repeat up to 5 rounds
   - Return final assistant message
5. Frontend renders bubbles

**The crucial design:** the agent's tool executor calls the same backend REST endpoints the UI uses. No direct DB access. This guarantees:
- One source of truth (MongoDB Atlas)
- Agent always sees current state
- Dashboard edits immediately reflected to agent

## Process layout

```
uni_carnival_8/
├── package.json                 ← root, runs both via concurrently
├── docs/                        ← local planning notes (gitignored)
├── data/  schema/  sample_queries/   ← from upstream fork
├── PROBLEM_STATEMENT.md  SUBMISSION.md  README.md  ← from upstream fork
│
├── backend/                     ← Express (port 4000)
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js
│       ├── db.js
│       ├── seed.js
│       ├── models/
│       │   ├── Schedule.js
│       │   ├── Room.js
│       │   ├── Event.js
│       │   ├── Announcement.js
│       │   └── Assignment.js
│       ├── routes/
│       │   ├── schedules.js
│       │   ├── rooms.js
│       │   ├── events.js
│       │   ├── announcements.js
│       │   ├── assignments.js
│       │   └── agent.js
│       ├── agent/
│       │   ├── prompt.js
│       │   ├── tools.js
│       │   └── executor.js
│       └── middleware/
│           ├── auth.js          ← requireAuth (JWT verify)
│           └── error.js
│
└── frontend/                    ← Next.js (port 3000)
    ├── package.json
    ├── .env.local.example
    ├── middleware.ts            ← route protection
    ├── next.config.js  tailwind.config.ts  tsconfig.json  components.json
    ├── app/
    │   ├── layout.tsx
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── signup/page.tsx
    │   ├── page.tsx             ← dashboard home
    │   ├── schedule/page.tsx
    │   ├── rooms/page.tsx
    │   ├── events/page.tsx
    │   ├── announcements/page.tsx
    │   ├── assignments/page.tsx
    │   ├── agent/page.tsx
    │   └── api/auth/[...all]/route.ts
    ├── components/
    │   ├── ui/                  ← shadcn
    │   ├── AuthProvider.tsx
    │   ├── Nav.tsx
    │   ├── DataTable.tsx
    │   ├── FormModal.tsx
    │   ├── ChatWindow.tsx
    │   └── MessageBubble.tsx
    └── lib/
        ├── auth.ts              ← Better Auth server config
        ├── auth-client.ts
        └── api.ts               ← typed fetch + Bearer header
```

## Why two processes

- Clean separation of concerns
- Backend reusable by mobile/CLI/etc. later
- Easier to demo one part if the other breaks
- Matches what judges expect from "production-shape" stack

Trade-off: judge must run both. Root `package.json` handles this with `concurrently` — one `npm run dev` from repo root starts everything.

## Identity flow

| Action | Identity source | Auto-fill field |
|---|---|---|
| Create announcement | session | `posted_by` = `req.user.name` |
| Create schedule | session | `instructor` left to user (not identity-bound) |
| Book room | session | `booked_by` = `req.user.name`, `booked_by_id` = `req.user.id` |
| Cancel booking | session | 403 unless `booked_by_id === req.user.id` |
| Register event | session | `student_id` = `req.user.student_id`, `name` = `req.user.name` |
| Cancel registration | session | 403 unless `student_id === req.user.student_id` |
| Agent tool call | session | executor passes `req.user` as context to tools |

## Port & URL summary

| Service | URL | Env var |
|---|---|---|
| Frontend | `http://localhost:3000` | (default) |
| Backend | `http://localhost:4000` | `PORT=4000` in `backend/.env` |
| Frontend → Backend | `http://localhost:4000` | `NEXT_PUBLIC_API_URL` in `frontend/.env.local` |
| Backend CORS allow | `http://localhost:3000` | `FRONTEND_ORIGIN` in `backend/.env` |
| Better Auth URL | `http://localhost:3000` | `BETTER_AUTH_URL` in `frontend/.env.local` |
