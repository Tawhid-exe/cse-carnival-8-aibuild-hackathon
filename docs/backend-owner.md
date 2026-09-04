# Backend Owner (Ahnaf) — Todo List

Your responsibility: backend is correct, persistent, and the agent actually works. Frontend and chat people depend on this being solid.

## 1. MongoDB Atlas setup (15 min)

1. Go to https://www.mongodb.com/atlas
2. Create free account / sign in
3. Create a **free M0 cluster** (any region, default works)
4. **Database Access** → add a user with read-write on `campusos` DB (save the password)
5. **Network Access** → add `0.0.0.0/0` (allows any IP — judges run from anywhere; this is critical)
6. **Deployment → Database** → click "Connect" → "Drivers" → copy the connection string
7. Paste into team chat. Format: `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/campusos?retryWrites=true&w=majority`

If a teammate's local test fails with "auth from this IP is not allowed" — step 5 was missed.

## 2. Groq API key (5 min)

1. Go to https://console.groq.com
2. Sign up, create API key
3. Paste into team chat
4. Team uses `llama-3.3-70b-versatile` model (already wired in `backend/src/agent/executor.js`)

## 3. Implement `seedIfEmpty()` (20 min)

File: `backend/src/seed.js`

Behavior:
- One function per collection
- For each: check `estimatedDocumentCount()`, if 0 → `insertMany` from `data/<name>.json`
- If non-empty → skip and log (preserves judge edits across restarts)
- Never `deleteMany`. Never write back to JSON files.

```js
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import Schedule from "./models/Schedule.js"
import Room from "./models/Room.js"
import Event from "./models/Event.js"
import Announcement from "./models/Announcement.js"
import Assignment from "./models/Assignment.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, "../../../data")

async function readJson(file) {
  const raw = await fs.readFile(path.join(DATA_DIR, file), "utf8")
  return JSON.parse(raw)
}

async function seedCollection(Model, file) {
  const count = await Model.estimatedDocumentCount()
  if (count > 0) {
    console.log(`[seed] ${Model.modelName}: ${count} docs, skip`)
    return
  }
  const data = await readJson(file)
  await Model.insertMany(data, { ordered: false })
  console.log(`[seed] ${Model.modelName}: inserted ${data.length}`)
}

export async function seedIfEmpty() {
  await seedCollection(Schedule, "schedules.json")
  await seedCollection(Room, "rooms.json")
  await seedCollection(Event, "events.json")
  await seedCollection(Announcement, "announcements.json")
  await seedCollection(Assignment, "assignments.json")
}
```

## 4. Wire seed into `server.js` (5 min)

File: `backend/src/server.js`

In `main()`:
```js
async function main() {
  await connectDB()
  await seedIfEmpty()
  app.listen(PORT, () => { ... })
}
```

Import:
```js
import { seedIfEmpty } from "./seed.js"
```

## 5. Verify `data/*.json` matches schema (10 min)

Open each file in `data/` and confirm field names match `schema/schema.md`:

- `schedules.json` → `id, course, title, day, start_time, end_time, room, instructor, section`
- `rooms.json` → `id, room_number, type, capacity, equipment, floor, status, bookings[]`
- `events.json` → `id, name, description, date, start_time, end_time, end_date, venue, organizer, capacity, registered, registrations[], status`
- `announcements.json` → `id, title, body, date, priority, posted_by, expires`
- `assignments.json` → `id, course, course_title, title, description, assigned_date, deadline, submission_platform, status, marks`

If any field name is different from what Mongoose expects, fix the Mongoose model — **never edit the JSON files**.

## 6. Curl smoke tests (20 min)

With the server running:

```bash
# Health
curl http://localhost:4000/health

# List (after seed runs)
curl http://localhost:4000/api/schedules | head -c 200
curl http://localhost:4000/api/rooms | head -c 200
curl http://localhost:4000/api/events | head -c 200
curl http://localhost:4000/api/announcements | head -c 200
curl http://localhost:4000/api/assignments | head -c 200

# Create
curl -X POST http://localhost:4000/api/announcements \
  -H "Content-Type: application/json" \
  -d '{"id":"ann-test","title":"Test","body":"Hello","date":"2026-09-04","priority":"low","posted_by":"Test","expires":"2026-09-30"}'

# Edit
curl -X PATCH http://localhost:4000/api/announcements/ann-test \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated"}'

# Delete
curl -X DELETE http://localhost:4000/api/announcements/ann-test

# Agent chat
curl -X POST http://localhost:4000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"When is my next class?"}]}'
```

Each must return 200 + valid JSON. The agent chat should return `{ reply: "..." }` with a useful answer.

## 7. Tune system prompt (20 min)

File: `backend/src/agent/prompt.js`

Make sure the prompt includes:

1. **Always call a tool first.** Never rely on memory of previous turns.
2. **The data below is what was true at the start of this turn. Always call a tool to refresh.**
3. **Refusal rules:**
   - "If the user asks you to delete records, cancel all bookings, or do anything destructive at scale, refuse politely and ask why."
   - "If the user asks you to act on someone else's behalf without naming them, ask for their name."
4. **Clarification rules:**
   - "If the time is vague ('tomorrow afternoon'), ask which time first."
   - "If the target is vague ('any room'), list 3 options and ask which to book."
5. **Format rules:**
   - Use markdown bullets for lists
   - Times in 12-hour format with AM/PM
   - Reference IDs (e.g., `evt-001`) when relevant

Test by running Q1–Q9 from `docs/handoff.md` and checking responses. If the agent hallucinates, tighten the prompt. If it refuses too often, add positive examples.

## 8. Write final public `README.md` (15 min)

Replace the current README with a clean, judge-facing version:

```markdown
# CampusOS

An intelligent university platform — five data systems + an AI agent that always reads live data.

## Quick start

```bash
git clone https://github.com/Tawhid-exe/cse-carnival-8-aibuild-hackathon.git
cd cse-carnival-8-aibuild-hackathon
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
# fill in MONGODB_URI and GROQ_API_KEY in backend/.env
npm install
npm install --prefix backend
npm install --prefix frontend
npm run dev
```

Backend at http://localhost:4000, frontend at http://localhost:3000.

## What it does

- 5 systems: Schedules, Rooms, Events, Announcements, Assignments
- Full CRUD on every system
- Book rooms, register for events (capacity-checked, dedup)
- AI agent that uses real tool calling to read live data
- Honors the schema in `schema/schema.md`

## Stack

- Frontend: Next.js 14, TypeScript, Tailwind, shadcn/ui
- Backend: Node.js, Express, Mongoose
- Database: MongoDB Atlas (free tier works)
- LLM: Groq (`llama-3.3-70b-versatile`)

## Env

`backend/.env`:
- `MONGODB_URI` — your Atlas connection string
- `GROQ_API_KEY` — your Groq key
- `PORT` — defaults to 4000
- `FRONTEND_ORIGIN` — defaults to http://localhost:3000

`frontend/.env.local`:
- `NEXT_PUBLIC_API_URL` — defaults to http://localhost:4000

## Try the agent

Open http://localhost:3000/agent and ask:

- "When is my next class?"
- "Book Room 7A02 tomorrow from 3 to 5 PM"
- "I'm free until 2 PM — anything to drop into?"
```

Add a screenshot of the dashboard and an example agent reply if you have time.

## 9. Final verification (5 min)

```bash
cd /path/to/repo
git grep -i "api_key\|secret\|password" -- ':!.env.example' ':!frontend/.env.local.example' ':!docs/'
```

Should return nothing. If anything shows up, fix it.

```bash
git status
```

No `.env` files should be staged.

## Done?

- [ ] Atlas cluster live with `0.0.0.0/0`
- [ ] Groq key shared
- [ ] `seedIfEmpty()` runs once and skips on subsequent boots
- [ ] All 5 collections populated on first boot
- [ ] All 6 REST endpoints curl-verified (list, create, edit, delete)
- [ ] Agent endpoint returns a real answer for at least 3 / 9 sample queries
- [ ] Final `README.md` written
- [ ] No secrets in committed code
- [ ] Changes committed and pushed to `feat/campusos-architecture`

After all checked, ping the team — they're waiting on your backend.
