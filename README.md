# CampusOS

**An intelligent campus operating system** — an AI-powered platform for AUST students: 5 campus data systems plus an AI agent that always reads live data via real tool calling. Never stale, never hallucinated.

---

## What It Does

- **5 campus systems** — Schedules, Rooms, Events, Announcements, Assignments — each with full CRUD (create, read, update, delete) through both the dashboard UI and the REST API.
- **Room booking with conflict detection** — booking a room checks every existing booking for time-overlap on the same date and rejects conflicts with a clear error.
- **Event registration with guardrails** — enforces capacity limits and rejects duplicate student registrations.
- **AI agent with real tool calling** — powered by Groq (`llama-3.3-70b-versatile`) using native function/tool calling. Every query executes actual tools against live MongoDB data, so answers always reflect the current database state.
- **Idempotent auto-seeding** — the provided dataset is loaded into MongoDB on first boot. Seeding is skipped if data already exists, so your edits survive restarts.

---

## Quick Start

```bash
git clone https://github.com/Tawhid-exe/cse-carnival-8-aibuild-hackathon.git
cd cse-carnival-8-aibuild-hackathon
# if work is on the feature branch:
# git checkout feat/campusos-architecture

cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
# edit backend/.env: add MONGODB_URI (MongoDB Atlas) and GROQ_API_KEY

npm install
npm install --prefix backend
npm install --prefix frontend
```

Run both servers with a single command from the repo root:

```bash
npm run dev
```

Or run them separately in two terminals:

```bash
npm run dev:backend    # terminal 1 -> http://localhost:4000
npm run dev:frontend   # terminal 2 -> http://localhost:3000
```

- Backend: http://localhost:4000 (health check at http://localhost:4000/health)
- Frontend: http://localhost:3000

---

## Environment Variables

### `backend/.env`

| Variable | Value | Notes |
|----------|-------|-------|
| `MONGODB_URI` | your Atlas connection string | MongoDB Atlas free tier works fine |
| `GROQ_API_KEY` | your Groq API key | free at [console.groq.com](https://console.groq.com) |
| `PORT` | `4000` | backend port |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | allowed CORS origin |

### `frontend/.env.local`

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` |

Notes:

- In MongoDB Atlas, network access must allow the machine running the backend — allowing `0.0.0.0/0` is the easiest option for a hackathon demo.
- Groq API keys are free; create one at [console.groq.com/keys](https://console.groq.com/keys).

---

## API Overview

All five systems expose the same CRUD shape, mounted under `/api`:

| Endpoint | Description |
|----------|-------------|
| `GET /api/schedules` | List schedules (filters: `day`, `course`, `instructor`, `room`, `section`) |
| `GET /api/rooms` | List rooms (filters: `type`, `min_capacity`, `equipment`, `room_number`, availability window) |
| `GET /api/events` | List events (filters: `date`, `status`) |
| `GET /api/announcements` | List announcements (filter: `priority`) |
| `GET /api/assignments` | List assignments (filters: `course`, `status`, `deadline_before`) |
| `GET /api/{system}/:id` | Get one record by id |
| `POST /api/{system}` | Create a record |
| `PUT /api/{system}/:id` | Update a record |
| `DELETE /api/{system}/:id` | Delete a record |

Action endpoints:

| Endpoint | Description |
|----------|-------------|
| `POST /api/rooms/:id/book` | Book a room (rejects time-overlap conflicts with `409`) |
| `DELETE /api/rooms/:id/book/:bookingId` | Cancel a booking |
| `POST /api/events/:id/register` | Register a student (capacity + duplicate checks, `409` on violation) |
| `DELETE /api/events/:id/register` | Cancel a registration |
| `POST /api/agent/chat` | Chat with the AI agent (tool calling over live data) |
| `GET /health` | Backend health check |

Where `{system}` is one of `schedules`, `rooms`, `events`, `announcements`, `assignments`.

---

## Try the Agent

Open **http://localhost:3000/agent** and ask things like:

- "When is my next class?"
- "What classes do I have on Wednesday?"
- "Assignments due this week?"
- "Show high priority announcements"
- "Find a lab with a projector and capacity for 30"
- "Book Room 7A02 tomorrow from 3:00 PM to 5:00 PM for project work" — it will ask for (or use) your name to attach to the booking
- "Register me for the Guest Lecture on Deep Learning"

Every answer comes from tools hitting the live MongoDB collections — add a class in the dashboard, ask the agent, and see it reflected immediately.

---

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express + Mongoose |
| Database | MongoDB Atlas |
| LLM | Groq (`llama-3.3-70b-versatile`) with native tool calling |

---

## Project Structure

```
cse-carnival-8-aibuild-hackathon/
├── backend/
│   └── src/
│       ├── models/        # Mongoose schemas (5 systems)
│       ├── routes/        # Express routes (5 systems + agent)
│       ├── agent/         # Groq tool definitions + agent executor
│       └── middleware/    # Error handling
├── frontend/
│   └── app/               # Next.js App Router pages (dashboard + agent)
├── data/                  # Seed JSON (schedules, rooms, events, announcements, assignments)
└── schema/                # Data schema reference for all 5 systems
```
