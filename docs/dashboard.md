# Dashboard + Home Page — Layout Spec

This is the spec Tawhid will build in `frontend/app/page.tsx`.

## Purpose

The home page is the showcase. It demonstrates:

- All 5 systems loaded and live (data management scoring)
- The app is beautiful and usable (UI/UX scoring)
- Data is fresh (agent reads from the same backend)

## Design vibe

- Linear / Vercel / Notion clean — minimal borders, lots of whitespace
- One accent color — **indigo `#4F46E5`** for primary actions; slate grays for everything else
- Mono font (`JetBrains Mono` via `next/font/google`) for IDs and timestamps
- Cards with subtle borders (`border-slate-200`), no heavy shadows
- Time displayed in **12-hour format with AM/PM** for human readability (agent still uses 24h internally)

## Layout (desktop ≥ 1024 px)

```
+--------------------------------------------------------------------+
| Nav [CampusOS] [Schedule][Rooms][Events][Announcements][Assignments][Agent] |
+--------------------------------------------------------------------+

   ┌──────────────────────────────────────────────────────────────────┐
   │ HERO                                                            │
   │                                                                  │
   │   Wednesday, September 4                          2:14 PM        │
   │                                                                  │
   │   ┌─ Now ─────────────────────┐   ┌─ Next ────────────────────┐ │
   │   │ ● CSE 4113                │   │ 2:00 PM  Math 3101         │ │
   │   │   8:00–9:30 · Room 7A03   │   │         Room 7A05          │ │
   │   │   ⏱ 11 min left           │   │                            │ │
   │   └───────────────────────────┘   └────────────────────────────┘ │
   │                                                                  │
   │                                    [Ask the agent →]             │
   └──────────────────────────────────────────────────────────────────┘

   ┌────────────────────────┐ ┌────────────────────────┐ ┌──────────────┐
   │ 🔴 ACTIVE ANNOUNCEMENTS│ │ 📅 UPCOMING EVENTS     │ │ 📝 DUE SOON │
   │                        │ │                        │ │              │
   │ ● Mid-semester Exam    │ │ ● Git Workshop         │ │ ● Lab 4      │
   │   Fill by Friday       │ │   Tomorrow · 3 PM      │ │   Tomorrow   │
   │   High priority        │ │   7C01                 │ │   CSE 4113   │
   │                        │ │   ▮▮▮▮▮▯▯ 12/20       │ │   30 marks   │
   │ ● Library hours        │ │                        │ │              │
   │   extended             │ │ ● Guest Lecture: DL    │ │ ● Essay      │
   │   Medium               │ │   Friday · 11 AM       │ │   In 3 days  │
   │                        │ │   7C03                 │ │   ENG 1101   │
   │  View all →            │ │                        │ │              │
   └────────────────────────┘ └────────────────────────┘ └──────────────┘

   ┌──────────────────────────────────────────────────────────────────┐
   │ SYSTEM OVERVIEW                                                  │
   │                                                                 │
   │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────────┐  ┌──────────────┐ │
   │  │  24  │  │  20  │  │   7  │  │    8     │  │      8       │ │
   │  │Sched.│  │Rooms │  │Events│  │Announce. │  │ Assignments  │ │
   │  │ View │  │ View │  │ View │  │   View   │  │     View     │ │
   │  └──────┘  └──────┘  └──────┘  └──────────┘  └──────────────┘ │
   └──────────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────────┐
   │ 💬 ASK CAMPUSOS                                                  │
   │                                                                  │
   │ [ Try: "What classes do I have on Wednesday?"     ] [Ask →]     │
   └──────────────────────────────────────────────────────────────────┘
```

## Layout (mobile < 768 px)

```
┌──────────────────────────┐
│ Wednesday, Sep 4         │
│ 2:14 PM        [→ Agent] │
└──────────────────────────┘
┌──────────────────────────┐
│ NOW: CSE 4113            │
│ NEXT: Math 3101 at 2 PM  │
└──────────────────────────┘
┌──────────────────────────┐
│ ACTIVE ANNOUNCEMENTS     │
│ ...                      │
└──────────────────────────┘
┌──────────────────────────┐
│ UPCOMING EVENTS          │
│ ...                      │
└──────────────────────────┘
┌──────────────────────────┐
│ DUE SOON                 │
│ ...                      │
└──────────────────────────┘
┌──────────────────────────┐
│ SYSTEM OVERVIEW          │
│ [Sched] [Rooms]          │
│ [Events] [Announce]      │
│ [Assignments]            │
└──────────────────────────┘
┌──────────────────────────┐
│ ASK CAMPUSOS             │
│ [Type here...]   [Ask]   │
└──────────────────────────┘
```

## Tailwind grid structure

```tsx
<div className="grid grid-cols-1 md:grid-cols-12 gap-4">
  {/* Hero */}
  <section className="md:col-span-12">{/* ... */}</section>

  {/* 3 cards */}
  <section className="md:col-span-4">{/* Announcements */}</section>
  <section className="md:col-span-4">{/* Events */}</section>
  <section className="md:col-span-4">{/* Assignments */}</section>

  {/* System overview */}
  <section className="md:col-span-12">{/* 5 stat cards */}</section>

  {/* Ask prompt */}
  <section className="md:col-span-12">{/* prompt form */}</section>
</div>
```

## Section-by-section spec

### 1. Hero strip

- **Left:** `Wednesday, September 4` + current time (live, `setInterval` every minute)
- **Right:** "Ask the agent →" primary indigo button (links to `/agent`)
- **Inner:** Two cards — "Now" and "Next" class
  - **Now** = class whose `start_time ≤ now < end_time`, indigo left border, "min left" countdown
  - **Next** = next class with `start_time > now`, plain
  - If today is weekend (Fri / Sat): show "Enjoy your weekend 🌴"

### 2. Active announcements (top-left card of bento row)

- **Data:** GET `/api/announcements`
- **Filter (client-side):** `priority=high OR (priority=medium AND date >= today-7)` AND `expires >= today`
- **Sort:** priority desc, then date desc
- **Show:** top 3 with red / yellow / no dot for priority

### 3. Upcoming events (middle card of bento row)

- **Data:** GET `/api/events`
- **Filter:** `date >= today`
- **Sort:** `date ASC, start_time ASC`
- **Show:** top 3 with name, relative date, time, venue, capacity bar (only if `registered > 0`)

### 4. Assignments due soon (right card of bento row)

- **Data:** GET `/api/assignments`
- **Filter:** `deadline ≤ today + 7 days` AND `status != graded`
- **Sort:** `deadline ASC`
- **Show:** top 3, color-coded red (overdue), yellow (due tomorrow), gray otherwise

### 5. System overview (full-width band)

- **Data:** 5 parallel GETs (full arrays, count on frontend via `data.length`)
- **Show:** 5 cards in a row (2-per-row on mobile via `grid-cols-2 md:grid-cols-5`), big mono number, system name, "View →" link

### 6. Ask CampusOS (full-width band)

- shadcn `Input` + indigo submit button
- Submit form → navigate to `/agent?q=<text>`, auto-fills the chat input

## Data flow

```ts
useEffect(() => {
  const [schedules, rooms, events, announcements, assignments] = await Promise.all([
    api.schedules(),
    api.rooms(),
    api.events(),
    api.announcements(),
    api.assignments(),
  ]);
  setState({ schedules, rooms, events, announcements, assignments });
}, []);
```

Optional: refetch every 60s via `setInterval` for live updates. Skip on first version to save time.

## Files

- `frontend/app/page.tsx` — full rewrite
- `frontend/components/DashboardCard.tsx` — reusable card with title + content slot
- `frontend/components/ClassRow.tsx` — one class row (used in hero "Now/Next")
- `frontend/components/EventCard.tsx` — one upcoming event
- `frontend/components/AssignmentRow.tsx` — one assignment
- `frontend/components/AnnouncementItem.tsx` — one announcement
- `frontend/components/SystemOverview.tsx` — 5 cards in a row

## Helper: today name

```ts
const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
// "Friday" — matches schema enum directly
```

## Helper: 12-hour formatter

```ts
function fmt12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}
```

## Empty states

| Section | Empty message |
|---|---|
| Today's classes (weekend) | "Enjoy your weekend 🌴" |
| Today's classes (no classes) | "No classes scheduled today" |
| Announcements | "No active announcements" |
| Events | "No upcoming events" |
| Assignments | "Nothing due in the next 7 days — nice!" |
| System overview | Each card shows `0` (no empty state for counts) |

## Acceptance criteria

- [ ] All 5 sections render with real data from MongoDB
- [ ] Layout responsive at 375 px / 768 px / 1280 px
- [ ] No console errors
- [ ] Initial paint < 1 s on local network (skeletons appear fast)
- [ ] Clicking a system card navigates to that page
- [ ] "Ask the agent" button on hero goes to `/agent`
- [ ] Priority colors match design
- [ ] Current "Now" class has indigo left border
- [ ] Empty states render correctly when a system has 0 records
