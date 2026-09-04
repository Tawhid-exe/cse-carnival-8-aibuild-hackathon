# 07 — AI Agent

## Design goals

1. **Live data always** — agent calls the same REST endpoints the UI calls. No direct DB access, no cached data, no hardcoded answers.
2. **Right actions** — when a user asks to book or register, the agent does it for real via the backend.
3. **Refuses / asks** — vague requests get a clarifying question. Unauthorized requests get a refusal.
4. **Transparent** — frontend renders which tools were called under each assistant bubble.

## Stack

- **Provider:** Groq (OpenAI-compatible API)
- **Model:** `llama-3.3-70b-versatile` (best free-tier tool-calling model)
- **SDK:** `groq-sdk` (mirrors `openai` SDK interface)

## The 8 tools

Each tool maps 1:1 to a backend REST endpoint. The agent executor uses `fetch` against `http://localhost:${PORT}/api/...`.

### 1. `list_schedules`
```js
{
  name: "list_schedules",
  description: "List class schedules. Use when the user asks about classes, timetable, what's on a given day, or who's teaching.",
  parameters: {
    type: "object",
    properties: {
      day: { type: "string", enum: ["Sunday","Monday","Tuesday","Wednesday","Thursday"] },
      course: { type: "string", description: "Course code e.g. CSE 4113" },
      instructor: { type: "string" },
      room: { type: "string" },
      section: { type: "string" }
    }
  }
}
```

### 2. `list_rooms`
```js
{
  name: "list_rooms",
  description: "List rooms with optional filters. Use when user asks about available rooms, labs, or filtering by equipment/capacity.",
  parameters: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["classroom","lab","seminar"] },
      min_capacity: { type: "number" },
      equipment: { type: "string", description: "e.g. projector, AC, whiteboard" },
      available_date: { type: "string", description: "YYYY-MM-DD" },
      available_start: { type: "string", description: "HH:MM" },
      available_end: { type: "string", description: "HH:MM" }
    }
  }
}
```

### 3. `list_events`
```js
{
  name: "list_events",
  description: "List campus events. Use for 'what's happening', registration queries, or event details.",
  parameters: {
    type: "object",
    properties: {
      date: { type: "string", description: "YYYY-MM-DD" },
      status: { type: "string", enum: ["upcoming","ongoing","completed","cancelled","full"] }
    }
  }
}
```

### 4. `list_announcements`
```js
{
  name: "list_announcements",
  description: "List announcements/notices. Use for 'any new notices?', priority filtering, or specific announcements.",
  parameters: {
    type: "object",
    properties: {
      priority: { type: "string", enum: ["high","medium","low"] }
    }
  }
}
```

### 5. `list_assignments`
```js
{
  name: "list_assignments",
  description: "List assignments. Use for 'what's due', course-specific work, or status queries.",
  parameters: {
    type: "object",
    properties: {
      course: { type: "string", description: "Course code" },
      status: { type: "string", enum: ["pending","submitted","graded","late"] },
      deadline_before: { type: "string", description: "YYYY-MM-DD — returns assignments due before this date" }
    }
  }
}
```

### 6. `book_room`
```js
{
  name: "book_room",
  description: "Book a room for a user. Requires exact room_number (e.g. '7A02'). Date in YYYY-MM-DD, times in HH:MM. Refuses vague requests — if user doesn't specify time, ASK first.",
  parameters: {
    type: "object",
    required: ["room_number", "date", "start_time", "end_time", "purpose"],
    properties: {
      room_number: { type: "string" },
      date: { type: "string" },
      start_time: { type: "string" },
      end_time: { type: "string" },
      purpose: { type: "string", description: "What the booking is for" }
    }
  }
}
```

### 7. `register_event`
```js
{
  name: "register_event",
  description: "Register the current user for an event by event id. The user's student_id and name come from their session — do not ask.",
  parameters: {
    type: "object",
    required: ["event_id"],
    properties: {
      event_id: { type: "string", description: "Event id e.g. evt-001" }
    }
  }
}
```

### 8. `cancel_booking`
```js
{
  name: "cancel_booking",
  description: "Cancel a room booking by room_number and booking_id. Only allowed for the user's own bookings.",
  parameters: {
    type: "object",
    required: ["room_number", "booking_id"],
    properties: {
      room_number: { type: "string" },
      booking_id: { type: "string" }
    }
  }
}
```

> Cancel actions (booking, registration) are the first cut if time slips — see `11-phase-plan.md` § Cuts.

## System prompt

```
You are CampusOS Assistant, a helpful AI for students at Ahsanullah University
of Science and Technology (AUST).

You answer questions and take actions by calling tools that read from and write
to the live campus database. The data you see through tools is always current —
never rely on memory or hardcoded facts.

Guidelines:
- For data questions, ALWAYS call the appropriate tool first. Do not guess.
- For actions like booking rooms or registering for events, confirm you have
  all required parameters. If anything is vague or missing, ASK the user a
  clarifying question instead of guessing or acting.
- For room bookings specifically, the user must provide: room number, date,
  start time, end time, and purpose. If any are missing, ask.
- For event registrations, just an event id is enough — the user's identity
  comes from their session.
- Refuse to book a room for someone else, share personal info about other
  students, or take actions outside your tools. Politely explain what you
  can do instead.
- When you complete an action, summarize it clearly: what was done, when, and
  any relevant id or confirmation.
- Keep answers concise and friendly. Use the user's name if you know it.
```

## Executor loop

`backend/src/agent/executor.js`:

```js
import Groq from "groq-sdk"
import { tools } from "./tools.js"
import { SYSTEM_PROMPT } from "./prompt.js"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MAX_ROUNDS = 5
const API_BASE = `http://localhost:${process.env.PORT || 4000}`

export async function runAgent({ messages, user, token }) {
  const transcript = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: `Current user: ${user.name} (student_id: ${user.student_id}).` },
    ...messages
  ]

  const toolCalls = []

  for (let i = 0; i < MAX_ROUNDS; i++) {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: transcript,
      tools,
      tool_choice: "auto",
      max_tokens: 1024
    })

    const msg = res.choices[0].message
    transcript.push(msg)

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      // Final answer
      return { message: msg, tool_calls: toolCalls }
    }

    // Execute each tool call
    for (const call of msg.tool_calls) {
      const args = JSON.parse(call.function.arguments)
      const result = await executeTool(call.function.name, args, token)
      toolCalls.push({ tool: call.function.name, args, result })
      transcript.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result)
      })
    }
  }

  // Hit round limit
  return {
    message: {
      role: "assistant",
      content: "I'm having trouble completing that — could you rephrase or break it into smaller requests?"
    },
    tool_calls: toolCalls
  }
}

async function executeTool(name, args, token) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  }

  switch (name) {
    case "list_schedules":
      return get("/api/schedules?" + qs(args), headers)

    case "list_rooms": {
      const params = new URLSearchParams()
      if (args.type) params.set("type", args.type)
      if (args.min_capacity) params.set("min_capacity", args.min_capacity)
      if (args.equipment) params.set("equipment", args.equipment)
      if (args.available_date) {
        params.set("available_date", args.available_date)
        params.set("available_start", args.available_start)
        params.set("available_end", args.available_end)
      }
      return get(`/api/rooms?${params}`, headers)
    }

    case "list_events":
      return get(`/api/events?${qs(args)}`, headers)

    case "list_announcements":
      return get(`/api/announcements?${qs(args)}`, headers)

    case "list_assignments":
      return get(`/api/assignments?${qs(args)}`, headers)

    case "book_room": {
      // Find room by room_number first
      const roomList = await get(`/api/rooms?room_number=${encodeURIComponent(args.room_number)}`, headers)
      if (!roomList.data?.length) return { error: `Room ${args.room_number} not found` }
      const room = roomList.data[0]
      return post(`/api/rooms/${room._id}/book`, headers, {
        date: args.date,
        start_time: args.start_time,
        end_time: args.end_time,
        purpose: args.purpose
      })
    }

    case "register_event": {
      const evList = await get(`/api/events?id=${encodeURIComponent(args.event_id)}`, headers)
      if (!evList.data?.length) return { error: `Event ${args.event_id} not found` }
      const ev = evList.data[0]
      return post(`/api/events/${ev._id}/register`, headers, {})
    }

    case "cancel_booking": {
      const roomList = await get(`/api/rooms?room_number=${encodeURIComponent(args.room_number)}`, headers)
      if (!roomList.data?.length) return { error: `Room ${args.room_number} not found` }
      const room = roomList.data[0]
      return del(`/api/rooms/${room._id}/book/${args.booking_id}`, headers)
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}

function qs(obj) {
  return new URLSearchParams(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
  ).toString()
}
async function get(path, h) { return (await fetch(API_BASE + path, { headers: h })).json() }
async function post(path, h, body) {
  return (await fetch(API_BASE + path, { method: "POST", headers: h, body: JSON.stringify(body) })).json()
}
async function del(path, h) {
  return (await fetch(API_BASE + path, { method: "DELETE", headers: h })).json()
}
```

> The executor calls our own backend. Since the request is loopback on the same machine, latency is ~5–20 ms per tool call. With 1–3 tool calls per turn, typical turn latency is 1–3 seconds.

## Route handler

`backend/src/routes/agent.js`:

```js
import { Router } from "express"
import { runAgent } from "../agent/executor.js"

const router = Router()

router.post("/chat", async (req, res) => {
  const { messages } = req.body
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" })
  }

  // Forward the requester's JWT so tool calls hit authed endpoints
  const token = req.headers.authorization?.slice(7)

  try {
    const result = await runAgent({ messages, user: req.user, token })
    res.json(result)
  } catch (err) {
    console.error("Agent error:", err)
    res.status(500).json({ error: "Agent failed", detail: err.message })
  }
})

export default router
```

## Frontend chat page

`frontend/app/agent/page.tsx`:

- `<ChatWindow />` with scrollable message list
- `<MessageBubble role="user" | "assistant" content tools?>` 
- Input box + send button
- On submit: `POST /api/agent/chat { messages }` (full transcript)
- Loading state while waiting (disable input, show spinner)
- Render `tool_calls[]` as small chips under assistant bubbles

State management: plain `useState` for messages. No Redux/Zustand needed for this.

## Handling the sample test queries

From `../sample_queries/sample_queries.md`:

| Query | Tool(s) the agent should call |
|---|---|
| "When is my next class?" | `list_schedules` with no filter, then reason over today's date |
| "What classes do I have on Wednesday?" | `list_schedules({day: "Wednesday"})` |
| "What assignments do I have due this week?" | `list_assignments` with deadline filter |
| "Show me all high priority announcements." | `list_announcements({priority: "high"})` |
| "I'm free until 2 PM — anything to drop into?" | `list_schedules` (find gap) + `list_events` (find in-window) |
| "Which labs have a projector and can fit 30+ people?" | `list_rooms({type: "lab", min_capacity: 30, equipment: "projector"})` |
| "Book Room 7A02 tomorrow 3–5 PM." | `book_room({room_number: "7A02", date: <tomorrow>, ...})` |
| "Register me for the Deep Learning lecture." | `list_events` → find matching → `register_event({event_id})` |
| "Room for 5 with a projector, tomorrow 2–4." | `list_rooms` with availability + capacity + equipment filters |
| "Just book me any room tomorrow afternoon." | **Should NOT call tools** — ask back: "Which time and what kind of room?" |

## Failure modes & mitigations

| Failure | Mitigation |
|---|---|
| LLM hallucinates a room number | Executor returns `404` from backend → LLM sees error → corrects |
| LLM tries to register without event_id | Executor returns error → LLM asks user |
| Groq 429 (rate limit) | Retry with exponential backoff (3 attempts) |
| Tool call loops forever | `MAX_ROUNDS = 5` cap |
| LLM makes up a booking | Backend `requireAuth` + `booked_by` from session prevents spoofing |
