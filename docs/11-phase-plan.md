# 11 — Phase Plan

Total budget: **~5h 10m**. Buffer: ~50 min for unexpected issues.

Phases run sequentially. Each phase has:
- A clear deliverable
- A time check
- An auto-cut if slipping

## Phase 0 — Setup (15 min)

**Goal:** scaffold the project, install all deps.

**Tasks:**
1. Confirm fork cloned, `data/` `schema/` `sample_queries/` present
2. Root `package.json` with `concurrently` + dev script
3. `cd backend && npm init -y && npm install express mongoose cors dotenv morgan groq-sdk jsonwebtoken`
4. `cd frontend && npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"`
5. `cd frontend && npm install better-auth`
6. `cd frontend && npx shadcn@latest init -d && npx shadcn@latest add button input dialog table card select textarea badge dropdown-menu toast avatar form label`
7. Add `docs/` to `.gitignore`

**Done when:** both `npm run dev` (or individual `npm run dev` per package) starts without error.

## Phase 1 — Backend foundation (35 min)

**Goal:** Express up, MongoDB connected, models defined, seed works.

**Tasks:**
1. `backend/src/server.js` — Express bootstrap, CORS, JSON parser, health check
2. `backend/src/db.js` — Mongoose connect from `MONGODB_URI`
3. `backend/src/models/{Schedule,Room,Event,Announcement,Assignment}.js` — schemas per `04-data-model.md`
4. `backend/src/seed.js` — reads `data/*.json`, idempotent insert
5. `backend/src/middleware/error.js` — global error handler
6. Wire seed into server startup
7. Test: start backend → `curl localhost:4000/health` → check DB has data

**Time check:** if >50 min, drop `Equipment` and `Floor` from Room model (just keep core fields).

## Phase 1.5 — Auth foundation (60 min)

**Goal:** Better Auth works, JWT bridge works, login/signup pages exist, demo account seeded.

**Tasks:**
1. `frontend/lib/auth.ts` — BA server config with MongoDB adapter + JWT plugin + `student_id` field
2. `frontend/app/api/auth/[...all]/route.ts` — catch-all handler
3. `frontend/lib/auth-client.ts` — client SDK
4. `frontend/middleware.ts` — route protection
5. `backend/src/middleware/auth.js` — JWT verify middleware
6. Update `backend/src/server.js` — `app.use("/api", requireAuth)`
7. `backend/src/seed.js` — add `ensureDemoUser()` (print credentials box)
8. `frontend/app/(auth)/login/page.tsx` — login form
9. `frontend/app/(auth)/signup/page.tsx` — signup form with name + student_id
10. `frontend/components/AuthProvider.tsx` — session context (if needed)
11. Test: signup → session cookie set → `curl -H "Authorization: Bearer <token>" localhost:4000/api/schedules` returns data

**Time check:** if >80 min, cut demo account auto-seed; judges must sign up.

## Phase 2 — REST CRUD (55 min)

**Goal:** All 5 systems have working CRUD + room booking + event registration.

**Tasks:**
1. `backend/src/routes/schedules.js` — 5 endpoints
2. `backend/src/routes/announcements.js` — 5 endpoints + `posted_by` from session
3. `backend/src/routes/assignments.js` — 5 endpoints
4. `backend/src/routes/rooms.js` — 5 CRUD + `POST /:id/book` (conflict check) + `DELETE /:id/book/:bookingId` (ownership)
5. `backend/src/routes/events.js` — 5 CRUD + `POST /:id/register` (capacity check, dedupe) + `DELETE /:id/register` (ownership)
6. Wire all routes in `server.js`
7. Test each endpoint with curl + a real JWT

**Time check:** if >75 min, drop cancel endpoints (Cut 1).

## Phase 3 — Frontend foundation (35 min)

**Goal:** App shell, nav, API client, route protection working.

**Tasks:**
1. `frontend/lib/api.ts` — typed fetch wrappers with Bearer header
2. `frontend/components/Nav.tsx` — top nav + user menu + logout
3. `frontend/app/layout.tsx` — global layout with nav
4. `frontend/app/page.tsx` — dashboard home with system counts
5. `frontend/components/DataTable.tsx` — reusable table
6. `frontend/components/FormModal.tsx` — reusable form modal
7. Build and run; test that nav redirects to login when unauthenticated, dashboard loads when authenticated

**Time check:** if >50 min, drop dashboard home (Cut 4); redirect `/` → `/schedule`.

## Phase 4 — Dashboard CRUD UI (65 min)

**Goal:** All 5 system pages with full CRUD, polished.

**Tasks:**
1. `/schedule/page.tsx` — table + add/edit/delete modals
2. `/announcements/page.tsx` — table + priority badge + modals
3. `/assignments/page.tsx` — table + status badge + modals
4. `/rooms/page.tsx` — table + bookings drawer + book slot form + conflict warning
5. `/events/page.tsx` — table + registrations drawer + register button + capacity warning
6. Polish: loading states, error toasts, empty states

**Time check:** if >90 min, apply Cut 2 (drop Edit on some pages).

## Phase 5 — AI Agent (70 min)

**Goal:** Agent loop works, 8 tools, chat page functional.

**Tasks:**
1. `backend/src/agent/prompt.js` — system prompt
2. `backend/src/agent/tools.js` — 8 tool definitions
3. `backend/src/agent/executor.js` — Groq loop + tool executor (calls own REST)
4. `backend/src/routes/agent.js` — `POST /api/agent/chat`
5. `frontend/components/ChatWindow.tsx` — chat UI
6. `frontend/components/MessageBubble.tsx` — bubble with tool chips
7. `frontend/app/agent/page.tsx` — wraps ChatWindow
8. Test all sample queries from `sample_queries/sample_queries.md`

**Time check:** if >95 min, apply Cut 5 (reduce to 5 tools).

## Phase 6 — Polish & ship (35 min)

**Goal:** README, env templates, manual test pass, git push.

**Tasks:**
1. Write public `README.md` based on `09-setup.md` (clean up internal-only parts)
2. Verify `.env.example` files exist and are committed
3. Verify `.env` and `.env.local` are gitignored
4. Manual test: every checkbox in `09-setup.md` § Manual test checklist
5. Live data test: edit announcement → agent sees it
6. Vague request test: "book me any room tomorrow" → agent asks back
7. `git add . && git commit -m "CampusOS MVP" && git push`
8. Final repo visibility check (must be public by deadline)

**Time check:** if >50 min, drop README polish; ship with minimal README.

## Time budget summary

```
Phase 0:  15 min
Phase 1:  35 min
Phase 1.5: 60 min  (auth — biggest phase)
Phase 2:  55 min
Phase 3:  35 min
Phase 4:  65 min
Phase 5:  70 min  (agent — second biggest)
Phase 6:  35 min
─────────────────
Total:   370 min  =  6h 10m

Reality check: the plan calls for 5h 10m; the difference is the buffer
between phase time check (~50 min over baseline) and baseline.
Apply cuts aggressively once we hit the first phase check.
```

## Order of attack for parallel work (if teammates)

If splitting between two people:
- **Person A** — backend phases 1, 2, 1.5
- **Person B** — frontend phase 3, 4
- **Together** — agent phase 5 (one writes tools, one writes UI)

## Done definition

The project is done when ALL of these are true:

1. `npm install && npm run dev` from root starts both processes cleanly
2. Browser to `localhost:3000` shows login page
3. After login, dashboard shows 24 schedules, 20 rooms, 7 events, 8 announcements, 8 assignments
4. CRUD on all 5 systems works; changes persist across reload
5. `/agent` answers the sample queries correctly
6. Agent takes action on "book room" and "register event" requests
7. Agent asks back on vague requests
8. Dashboard edit + immediate agent query reflects the change
9. Public `README.md` lets a fresh user go from clone to working in <15 minutes
10. Repo is public
11. No real API keys committed
