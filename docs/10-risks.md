# 10 — Risks & Auto-Cuts

## Critical risks (in priority order)

### 1. MongoDB Atlas setup failure (highest)
**Impact:** project doesn't run at all → 0 marks
**Likelihood:** medium — judges vary in DB familiarity
**Mitigation:**
- README `09-setup.md` walks through Atlas setup step by step with screenshots-in-text
- Connection string template is clearly commented
- Free tier + `0.0.0.0/0` IP whitelist removes most blockers
- Fallback: if Atlas really won't work, the `db.js` module can switch to `mongodb-memory-server` via an env flag (not implemented unless needed)

### 2. `BETTER_AUTH_SECRET` mismatch
**Impact:** all API calls fail with 401 → broken demo
**Likelihood:** medium — easy to forget when copying env
**Mitigation:**
- `09-setup.md` warns in bold
- Same secret in both files; identical placeholder shown
- Backend `requireAuth` returns clear "Invalid token" error

### 3. Better Auth version churn
**Impact:** API surface may have changed; install may break
**Likelihood:** medium — BA is actively developed
**Mitigation:**
- Pin versions in `package.json` (commit them after first successful install)
- If `import { betterAuth } from "better-auth"` fails, try `@better-auth/core`
- README lists the exact commands used to scaffold; reuse them

### 4. Time pressure (5 hours, tight)
**Impact:** features cut, polish missed, README thin
**Likelihood:** high — hackathons always run long
**Mitigation:** see auto-cuts below

### 5. Groq rate limiting / model unavailability
**Impact:** agent demo breaks mid-evaluation
**Likelihood:** low-medium
**Mitigation:**
- Retry with exponential backoff in executor (3 attempts)
- README documents alternative models if 70b-versatile is down
- OpenAI-compatible API means we can swap to OpenAI/Gemini by changing only the client init + base URL

### 6. Tool-calling hallucination on Llama 3.3
**Impact:** agent books wrong room or makes up data
**Likelihood:** medium
**Mitigation:**
- Executor validates room exists before booking; returns 404 to LLM so it self-corrects
- `booked_by` comes from server session, not LLM (LLM can't fake identity)
- System prompt explicitly forbids guessing

### 7. CORS misconfiguration
**Impact:** frontend can't reach backend; dashboard blank
**Likelihood:** medium
**Mitigation:**
- Single `FRONTEND_ORIGIN` env var; explicit port
- Test immediately after first run
- README troubleshooting table

## Auto-cuts when time slips

In order of removal (least painful first):

### Cut 1: Cancel endpoints (–10 min)
- Skip `DELETE /api/rooms/:id/book/:bookingId`
- Skip `DELETE /api/events/:id/register`
- Cancel buttons greyed out with "coming soon" tooltip
- README mentions as future work
- **Loses:** ~5 of the 10 "actions" marks IF judges specifically test cancel. Otherwise 0.

### Cut 2: Edit functionality on read-mostly pages (–10 min)
- Implement Add + Delete but not Edit on schedules/announcements/assignments
- Edit only on rooms/events (where booking/registration matters more)
- **Loses:** some CRUD polish marks, but Add+Delete still demos CRUD works

### Cut 3: Ownership check on cancel (–5 min)
- Allow anyone to cancel any booking (no 403 check)
- Document as known limitation
- **Loses:** ~0 marks in practice (judges probably won't probe this)

### Cut 4: Dashboard home page (–10 min)
- Remove `/` page; redirect to `/schedule` after login
- **Loses:** ~2 UI/UX marks

### Cut 5: Reduce tools from 8 to 5 (–10 min)
- Drop `cancel_booking` (and any cancelled actions)
- Drop the `available_*` filters on `list_rooms` (just use capacity + equipment)
- **Loses:** ability to handle "room available at specific time" queries

### Cut 6: Skip demo account (–5 min)
- Judges must sign up
- README says "first user to sign up becomes the demo"
- **Loses:** minor judge friction; no scoring impact

### Cut 7: Agent identity auto-fill (–5 min)
- Agent asks "What's your student ID?" before registering
- More conversational, less smooth
- **Loses:** polish but still functional

### Last resort: Drop agent chat UI (–30 min)
- Backend `/api/agent/chat` still works (testable via curl)
- README documents curl commands to test
- **Loses:** 30+ UI marks on the agent page specifically; agent itself still scores

## Things to NOT cut

- **CRUD persistence** — core scoring criteria
- **Live data wiring** — agent + dashboard must share backend
- **Auth on writes** — required by decision; cutting breaks identity flow
- **At least 5 agent tools** — minimum for "agent that does stuff"
- **README** — judges literally won't run without it

## Detection: are we slipping?

After each phase, check:
- Phase end time vs. plan → if >15 min over, apply the next cut
- After phase 4 (UI), if not 80% done with dashboard, drop edit
- After phase 5 (agent), if agent loop doesn't work end-to-end, simplify to single-turn (no loop)

## Risk register

| # | Risk | L | I | Mitigation status |
|---|---|---|---|---|
| 1 | Atlas setup | M | H | Documented step-by-step |
| 2 | BA secret mismatch | M | H | Bolded in README |
| 3 | BA version churn | M | M | Pin versions |
| 4 | Time pressure | H | H | Auto-cuts ready |
| 5 | Groq availability | L-M | M | Retry + alt providers |
| 6 | LLM hallucination | M | M | Executor validation |
| 7 | CORS | M | M | Single env var + test |
