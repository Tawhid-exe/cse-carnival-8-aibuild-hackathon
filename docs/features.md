# CampusOS — Feature Plan

Full inventory of features needed to hit the 100-mark rubric. Each feature is tagged with which scoring bucket it feeds.

## Scoring coverage map

| Bucket | Marks | Features |
|---|---|---|
| Data Management | 20 | F1, F2, F3, F4, F5 |
| CRUD Operations | 20 | F6, F7, F8, F9, F10, F11, F12, F13, F14, F15 |
| Agent — correctness | 10 | F19–F24 |
| Agent — actions | 10 | F25–F29 |
| Agent — fresh data | 10 | F30, F31 |
| Agent — safety / clarification | 10 | F32–F36 |
| UI / UX | 20 | F37–F56 |
| Bonus (minus deploy) | — | F59, F60 |

## A. Data Management (20 marks)

| # | Feature | Notes |
|---|---|---|
| F1 | Auto-seed on first startup, skip on subsequent boots | `seedIfEmpty()` per collection |
| F2 | 5 dedicated pages, one per system | `/schedule`, `/rooms`, `/events`, `/announcements`, `/assignments` |
| F3 | Dashboard home with counts + "today" view | Hero + bento grid (see `dashboard.md`) |
| F4 | Today strip (next 3 classes, latest 3 announcements, upcoming 2 events) | On dashboard |
| F5 | Refetch-on-mutation (no manual refresh) | After every create / update / delete |

## B. CRUD (20 marks)

Per-system, repeated 5×:
| # | Feature |
|---|---|
| F6 | List view (table or card grid) |
| F7 | Create modal with form |
| F8 | Edit modal with form pre-filled |
| F9 | Delete with confirm dialog |
| F10 | Toast on success / error |
| F11 | Form validation with inline errors (client + server) |

System-specific extras:
| # | Feature |
|---|---|
| F12 | Book a room (POST `/api/rooms/:id/bookings`) — overlap-checked |
| F13 | Cancel a booking (DELETE `/api/rooms/:id/bookings/:booking_id`) |
| F14 | Register for event (POST `/api/events/:id/register`) — capacity-checked + dedup by `student_id` |
| F15 | Cancel registration (DELETE `/api/events/:id/register`) |

## C. AI Agent (40 marks)

### Tool surface

| # | Tool | Endpoint hit |
|---|---|---|
| T1 | `list_schedules` | GET `/api/schedules?day=&course=` |
| T2 | `list_rooms` | GET `/api/rooms?type=&min_capacity=&equipment=` |
| T3 | `list_events` | GET `/api/events?date=&name=` |
| T4 | `list_announcements` | GET `/api/announcements?priority=` |
| T5 | `list_assignments` | GET `/api/assignments?deadline_within=` |
| T6 | `book_room` | POST `/api/rooms/:id/bookings` |
| T7 | `cancel_booking` | DELETE `/api/rooms/:id/bookings/:booking_id` |
| T8 | `register_event` | POST `/api/events/:id/register` |
| T9 | `cancel_registration` | DELETE `/api/events/:id/register` |
| T10 | `update_announcement` | PATCH `/api/announcements/:id` (for "post a notice" requests) |

### Per-query capability matrix

| Sample query | Tools used | Logic |
|---|---|---|
| "When is my next class?" | T1 | Filter today + future start time, sort, return first |
| "What classes on Wednesday?" | T1 | Filter `day=Wed` |
| "Assignments due this week?" | T5 | `deadline_within=7d`, exclude `submitted`/`graded` |
| "High priority announcements?" | T4 | Filter `priority=high`, exclude expired (`expires < today`) |
| "I'm free until 2 PM — anything to drop into?" | T1 + T3 | Read today's schedule, find free slot until 2 PM, list events happening in that window |
| "Labs with projector + ≥30 capacity?" | T2 | Filter `type=lab`, `equipment includes projector`, `capacity >= 30` |
| "Book Room 7A02 tomorrow 3–5 PM" | T2 + T6 | Find room by `room_number`, POST booking, check overlap |
| "Register me for the Guest Lecture on Deep Learning" | T3 + T8 | Find event by name match, POST registration |
| "Room for 5 with projector, tomorrow 2–4" | T2 + T6 | Find matching rooms, check free in window, book first match |
| Mid-eval edit + query | T3/T4/T5 | Tools always re-read DB; LLM never caches |

### Safety / clarification rules (system prompt)

| # | Behavior |
|---|---|
| F32 | Vague time ("book tomorrow afternoon") → ask which time first |
| F33 | Vague target ("book any room") → ask which room |
| F34 | Out-of-scope action ("delete all schedules") → refuse politely |
| F35 | Bulk requests ("register 50 people") → handle per-person or ask for confirmation |
| F36 | Missing context ("register me" without event) → ask which event |
| F36b | Unauthorized ("book on someone else's behalf") → refuse, ask for `booked_by` name |

### Fresh-data guarantee

- Tools hit `GET /api/...` every call — never store result in a closure between agent turns
- After CRUD mutation, the next agent response reflects the change within seconds
- System prompt explicitly says: "the data below is what is true **right now**, but always call a tool to refresh before answering"

## D. UI / UX (20 marks)

### Must-haves

| # | Feature |
|---|---|
| F37 | Sticky top nav, current page highlighted |
| F38 | shadcn/ui base components (Button, Card, Table, Dialog, Input, Select, Badge, Toast, AlertDialog, Skeleton) |
| F39 | Responsive — usable on phone, tablet, desktop |
| F40 | Loading skeletons on every page |
| F41 | Error toasts on failed mutations |
| F42 | Empty states ("No events scheduled yet") |
| F43 | Confirm dialog for delete (`AlertDialog`) |
| F44 | Inline form validation |
| F45 | Priority badges color-coded (red high, yellow medium, gray low) |
| F46 | Status badges on events (upcoming / ongoing / completed / cancelled) |
| F47 | Room availability indicator (green available / red unavailable) |

### Should-haves

| # | Feature |
|---|---|
| F48 | Search / filter on list pages |
| F49 | Group view on schedule page (by day) |
| F50 | "Today" highlighted on schedule grid |
| F51 | Capacity bar on event cards (registered / capacity) |
| F52 | Equipment chips on room cards |
| F53 | Status badges on assignment cards (pending / submitted / graded / late) |

### Nice-to-haves

| # | Feature |
|---|---|
| F54 | Dark mode toggle |
| F55 | Confetti on successful booking |
| F56 | Recent activity feed on dashboard |

## E. Bonus (minus deployment)

| # | Feature |
|---|---|
| F57 | ~~Deploy to Vercel (frontend)~~ — **out of scope** |
| F58 | ~~Deploy to Render (backend)~~ — **out of scope** |
| F59 | README with clone / install / env / run steps |
| F60 | `.env.example` with helpful comments |

## Out of scope (explicit cuts)

- Deployment (Vercel / Render / Railway)
- Streaming / SSE on chat
- Better Auth / login pages / `middleware.ts`
- Dark mode (F54) — cut for time
- Activity feed on dashboard (F56) — cut for time
