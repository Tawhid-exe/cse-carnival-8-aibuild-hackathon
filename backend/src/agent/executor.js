import Groq from "groq-sdk"
import { tools } from "./tools.js"
import { SYSTEM_PROMPT } from "./prompt.js"

const MAX_ROUNDS = 5
const MODEL = "llama-3.3-70b-versatile"
const API_BASE = `http://localhost:${process.env.PORT || 4000}`

let _groq = null
function getGroq() {
  if (!_groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set in backend/.env")
    }
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return _groq
}

export async function runAgent({ messages }) {
  const groq = getGroq()
  const transcript = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages
  ]
  const toolCalls = []

  for (let i = 0; i < MAX_ROUNDS; i++) {
    const res = await groq.chat.completions.create({
      model: MODEL,
      messages: transcript,
      tools,
      tool_choice: "auto",
      max_tokens: 1024
    })

    const msg = res.choices[0].message
    transcript.push(msg)

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return { message: msg, tool_calls: toolCalls }
    }

    for (const call of msg.tool_calls) {
      const args = typeof call.function.arguments === "string"
        ? JSON.parse(call.function.arguments)
        : call.function.arguments
      const result = await executeTool(call.function.name, args)
      toolCalls.push({ tool: call.function.name, args, result })
      transcript.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result)
      })
    }
  }

  return {
    message: {
      role: "assistant",
      content: "I'm having trouble completing that — could you rephrase or break it into smaller requests?"
    },
    tool_calls: toolCalls
  }
}

function qs(obj) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v))
  }
  return p.toString()
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`)
  return res.json()
}
async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
  return res.json()
}
async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE" })
  return res.ok ? res.json() : { error: `HTTP ${res.status}` }
}

async function executeTool(name, args) {
  try {
    switch (name) {
      case "list_schedules":
        return apiGet(`/api/schedules?${qs(args)}`)

      case "list_rooms":
        return apiGet(`/api/rooms?${qs(args)}`)

      case "list_events":
        return apiGet(`/api/events?${qs(args)}`)

      case "list_announcements":
        return apiGet(`/api/announcements?${qs(args)}`)

      case "list_assignments":
        return apiGet(`/api/assignments?${qs(args)}`)

      case "book_room": {
        const list = await apiGet(`/api/rooms?room_number=${encodeURIComponent(args.room_number)}`)
        if (!list.data?.length) return { error: `Room ${args.room_number} not found` }
        return apiPost(`/api/rooms/${list.data[0].id}/book`, {
          date: args.date,
          start_time: args.start_time,
          end_time: args.end_time,
          booked_by: args.booked_by,
          purpose: args.purpose
        })
      }

      case "register_event": {
        const list = await apiGet(`/api/events?id=${encodeURIComponent(args.event_id)}`)
        if (!list.data?.length) return { error: `Event ${args.event_id} not found` }
        return apiPost(`/api/events/${list.data[0].id}/register`, {
          student_id: args.student_id,
          name: args.name
        })
      }

      case "cancel_booking": {
        const list = await apiGet(`/api/rooms?room_number=${encodeURIComponent(args.room_number)}`)
        if (!list.data?.length) return { error: `Room ${args.room_number} not found` }
        return apiDelete(`/api/rooms/${list.data[0].id}/book/${args.booking_id}`)
      }

      default:
        return { error: `Unknown tool: ${name}` }
    }
  } catch (err) {
    return { error: err.message }
  }
}
