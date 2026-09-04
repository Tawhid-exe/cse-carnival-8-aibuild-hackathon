# CampusOS — Handoff & Work Assignments

3-person team, ~3 hours to deadline (8:30 PM, 4 September). Branch: `feat/campusos-architecture` on `Tawhid-exe/cse-carnival-8-aibuild-hackathon`.

## Team

| Role | Person | Owns |
|---|---|---|
| Backend owner | Ahnaf (you) | Atlas + Groq, seed wiring, REST smoke tests, prompt tuning, final README |
| CRUD UI owner | Tawhid | shadcn setup, reusable components, 5 CRUD pages, dashboard |
| Agent chat owner | third person | ChatWindow, MessageBubble, sample query test pass, mid-eval edit test |

## Setup commands (everyone runs these first)

```bash
git clone https://github.com/Tawhid-exe/cse-carnival-8-aibuild-hackathon.git
cd cse-carnival-8-aibuild-hackathon
git fetch origin
git checkout feat/campusos-architecture
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
npm install
npm install --prefix backend
npm install --prefix frontend
```

Ahnaf pastes the MongoDB Atlas + Groq keys into the team chat. Each person fills their own `.env` files locally.

## Coordination rules

- **One Atlas owner** — Ahnaf creates the cluster, gets the connection string, pastes it in chat
- **One Groq key** is fine for all three
- **Do not commit `.env` files** — already in `.gitignore`, double-check with `git status` before commit
- **Merge often to `feat/campusos-architecture`** — don't sit on a branch for hours
- **Status check-in every 30 min** in group chat

## Sample query coverage (third person owns testing)

| # | Query | Tools used | Pass criteria |
|---|---|---|---|
| Q1 | "When is my next class?" | T1 | Returns next class with course, time, room |
| Q2 | "What classes on Wednesday?" | T1 | Lists all Wed classes with time + room |
| Q3 | "Assignments due this week?" | T5 | Lists pending assignments with deadline ≤ today+7 |
| Q4 | "High priority announcements?" | T4 | Lists non-expired `priority=high` |
| Q5 | "Free until 2 PM — anything to drop into?" | T1 + T3 | Cross-references schedule + events, suggests ≥ 1 event |
| Q6 | "Labs with projector + ≥30 capacity?" | T2 | Lists matching rooms with capacity shown |
| Q7 | "Book Room 7A02 tomorrow 3–5 PM" | T2 + T6 | Creates booking, confirms with `booking_id` |
| Q8 | "Register me for Guest Lecture on Deep Learning" | T3 + T8 | Registers, confirms with student name |
| Q9 | "Room for 5 with projector, tomorrow 2–4" | T2 + T6 | Finds match, books or lists options |

## Mid-eval edit + query test (the killer test)

Judges will literally edit a record through the dashboard and ask the agent about it immediately. Flow:

1. Open `/announcements` in the browser, edit "CSE321 class cancelled" → "CSE321 moved to Room 304 at 2:00 PM"
2. Save, no reload
3. Open `/agent` in another tab, ask: "Where is my CSE321 class today?"
4. Agent must reply with the new content within seconds

This test is in `docs/features.md` as F30, F31. **It must pass before submission.**

## Time budget (target finish 8:00 PM, buffer 30 min)

| Time | Target |
|---|---|
| Now | All three pull, Atlas up, env configured |
| +30 min | Seed works, backend CRUD curl-verified, Tawhid starts shadcn, third person has ChatWindow skeleton |
| +1.5 hr | All 5 CRUD pages functional, agent chat works for 5 / 9 sample queries |
| +2.5 hr | All sample queries passing, UI polished, README drafted |
| +3 hr | Final manual test pass, push, make repo public |
| 8:30 PM | Submission deadline |

## Auto-cuts when behind

| When behind | Cut |
|---|---|
| T+1 h | F55 confetti, F56 activity feed |
| T+2 h | F49 schedule grouping, F52 equipment chips, F53 status badges |
| T+2.5 h | F48 search / filter, F51 capacity bar |
| T+2.75 h | F50 "today highlight" on schedule |

**Never** cut CRUD + 9 / 9 agent queries + clean UI for the 5 pages — that's the floor for 80+ marks.

## Files per person

### Ahnaf (backend)

- `backend/src/seed.js` — implement `seedIfEmpty()`
- `backend/src/server.js` — wire seed into startup
- `backend/src/agent/prompt.js` — system prompt refinement
- `README.md` — public, with screenshots + steps
- `backend/.env`, `frontend/.env.local` — Atlas + Groq creds

### Tawhid (CRUD UI)

- `frontend/app/page.tsx` — dashboard (see `dashboard.md`)
- `frontend/app/{schedule,rooms,events,announcements,assignments}/page.tsx` — CRUD pages
- `frontend/components/{DataTable,FormModal,EmptyState,LoadingSkeleton,SystemOverview,EventCard,AssignmentRow,AnnouncementItem,ClassRow}.tsx`
- `frontend/components/ui/*` — shadcn components

### Third person (agent chat)

- `frontend/app/agent/page.tsx` — chat page
- `frontend/components/{ChatWindow,MessageBubble}.tsx`
- `docs/agent-test-log.md` — results of running all 9 sample queries

## Branch strategy

- `feat/campusos-architecture` is the integration branch
- Each person can either commit directly to it, or branch off + merge when their piece is done
- **Priority is completion**, not branch hygiene — direct commits to integration branch are fine

## What we are explicitly NOT doing

- Deployment (Vercel / Render)
- Streaming / SSE on chat
- Better Auth / login pages / `middleware.ts`
- Dark mode (F54)
- Mid-eval edit notifications on dashboard
