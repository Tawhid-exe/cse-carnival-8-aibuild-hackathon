# 01 — The CampusOS Problem

## The scenario

AUST students face daily friction:
- Class moved? Buried in a 200-message WhatsApp group.
- Deadline forgotten? Friend mentions it like it's obvious.
- Free hour between classes? No idea what's happening on campus right now.

Information exists across notice boards, chats, spreadsheets, and people's heads — never in one place when needed.

**Mission:** put it all in one place and put an AI on top that can both answer questions and take actions (book rooms, register for events).

## What you build

Two parts, both required, both must run on the judge's machine straight from the submission.

### Part 1 — Campus Data Manager
A dashboard for the 5 campus data systems. Full CRUD. Changes persist in a real backend and show up immediately in the UI. The same backend state is what the agent reads.

### Part 2 — AI Agent
An LLM with real tool/function calling that always reads live data. Answers questions, takes actions, asks back when vague, refuses when unauthorized.

## The 5 data systems

| System | Records (seed) | Beyond CRUD |
|---|---|---|
| Schedules | 24 | — |
| Rooms | 20 | Book a slot, cancel a booking |
| Events | 7 | Register, cancel registration |
| Announcements | 8 | — |
| Assignments | 8 | — |

See `../schema/schema.md` for exact field definitions. AUST room convention: `7A01–7A07` classrooms, `7B01–7B08` labs, `7C01–7C05` seminar halls. Week is Sun–Thu. Times are 24h `HH:MM`. Dates are ISO `YYYY-MM-DD`.

## Scoring (100 marks total)

| Criteria | Marks |
|---|---|
| Data Management — backend loaded, displayed clearly | 20 |
| CRUD — add/edit/delete works, changes persist | 20 |
| AI Agent (split below) | 40 |
| UI/UX — usable, clear, polished | 20 |

### Agent breakdown (40 marks)

| Criteria | Marks |
|---|---|
| Correct answers across the data | 10 |
| Right actions (book, register) | 10 |
| Always uses latest data | 10 |
| Refuses/asks when needed (vague or unauthorized) | 10 |

### Bonus
- Live deployment
- Clean, readable, well-organized code

## Hard rules
- Any language, any framework, any platform (web/mobile/desktop/terminal).
- Any LLM (we chose Groq — see `03-tech-stack.md`).
- **MUST** use real tool/function calling. Prompt chaining where the LLM pretends to query data does not count.
- Both parts must exist and must run on the judge's machine from a clean clone.

## What the agent is tested on (sample queries)

See `../sample_queries/sample_queries.md`. Highlights:

- **Simple lookups:** *"When is my next class?"*, *"What assignments due this week?"*
- **Multi-source reasoning:** *"I'm free until 2 PM — anything on campus I could drop into?"* (needs schedule + events cross-referenced)
- **Actions:** *"Book Room 7A02 tomorrow 3–5 PM"*, *"Register me for the Deep Learning lecture"*
- **Vague:** *"Just book me any room tomorrow afternoon"* — must ask which time and room
- **Live data:** judges edit via dashboard then immediately query the agent about the change

## Two failure modes the judges hunt for

1. **Stale answers** — agent caches or hardcodes seed JSON. Judge edits, asks again, gets old answer. Loses the 10 "live data" marks.
2. **Hallucinated actions** — agent says "booked!" without writing to DB. Reload, nothing happened. Loses the 10 "right actions" marks.

The single backend shared between UI and agent prevents both.

## Deadline

**8:30 PM, 4 September 2026.** Late submissions not accepted.

## Submission

- Public GitHub repo containing the full solution
- README with working local setup steps
- `.env.example` (no real keys)
- See `../SUBMISSION.md` for full checklist.

## The example moment

> Step 1: someone edits the announcement from *"CSE321 class cancelled"* → *"CSE321 moved to Room 304 at 2 PM"*.
> Step 2: a student asks *"Where is my CSE321 class today?"*
> Step 3: agent replies *"CSE321 has been moved to Room 304 today at 2 PM."*

That's the whole idea.
