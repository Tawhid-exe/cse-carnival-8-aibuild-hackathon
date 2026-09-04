import OpenAI from "openai"
import { tools } from "./tools.js"
import { SYSTEM_PROMPT } from "./prompt.js"
import * as scheduleService from "../services/scheduleService.js"
import * as roomService from "../services/roomService.js"
import * as eventService from "../services/eventService.js"
import * as announcementService from "../services/announcementService.js"
import * as assignmentService from "../services/assignmentService.js"

const MAX_ROUNDS = 5
const MAX_RETRIES = 3
const INITIAL_DELAY_MS = 2000
const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash"

let _client = null
function getClient() {
  if (!_client) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in backend/.env")
    }
    _client = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    })
  }
  return _client
}

/**
 * Retry a function with exponential backoff for transient API errors (429, 503).
 */
async function retryWithBackoff(fn, retries = MAX_RETRIES, delayMs = INITIAL_DELAY_MS) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const status = err?.status || err?.response?.status || err?.code
      const isRetryable = status === 429 || status === 503 || /overloaded|rate.limit|resource.exhausted/i.test(err.message)
      if (!isRetryable || attempt === retries) {
        throw err
      }
      const jitter = Math.random() * 500
      const waitMs = delayMs * Math.pow(2, attempt) + jitter
      console.warn(`[agent] Gemini API ${status || 'error'}, retrying in ${Math.round(waitMs)}ms (attempt ${attempt + 1}/${retries})...`)
      await new Promise(resolve => setTimeout(resolve, waitMs))
    }
  }
}

export async function runAgent({ messages, student_id, name, user_id }) {
  const client = getClient()
  const now = new Date()
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" })
  const iso = now.toISOString().slice(0, 10)
  let system = `${SYSTEM_PROMPT}\n\nCurrent date: ${weekday}, ${iso}.`
  if (student_id && name) {
    system += `\nThe user you are helping is ${name} (student ID: ${student_id}). Use this identity for room bookings and event registrations unless they explicitly say otherwise.`
  }
  const transcript = [
    { role: "system", content: system },
    ...messages
  ]
  const toolCalls = []

  const userContext = { student_id, name, user_id, id: user_id }

  for (let i = 0; i < MAX_ROUNDS; i++) {
    const res = await retryWithBackoff(() =>
      client.chat.completions.create({
        model: MODEL,
        messages: transcript,
        tools,
        tool_choice: "auto",
        max_tokens: 1024
      })
    )

    const msg = res.choices[0].message
    transcript.push(msg)

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return { message: msg, tool_calls: toolCalls }
    }

    for (const call of msg.tool_calls) {
      const args = typeof call.function.arguments === "string"
        ? JSON.parse(call.function.arguments)
        : call.function.arguments
      const result = await executeTool(call.function.name, args, userContext)
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

async function executeTool(name, args, userContext = {}) {
  try {
    switch (name) {
      case "list_schedules": {
        const data = await scheduleService.listSchedules(args)
        return { data, count: data.length }
      }

      case "list_rooms": {
        const data = await roomService.listRooms(args)
        return { data, count: data.length }
      }

      case "list_events": {
        if (args.id) {
          const item = await eventService.getEvent(args.id)
          return { data: item }
        }
        const data = await eventService.listEvents(args)
        return { data, count: data.length }
      }

      case "list_announcements": {
        const data = await announcementService.listAnnouncements(args)
        return { data, count: data.length }
      }

      case "list_assignments": {
        const data = await assignmentService.listAssignments(args)
        return { data, count: data.length }
      }

      case "book_room": {
        const rooms = await roomService.listRooms({ room_number: args.room_number })
        if (!rooms || rooms.length === 0) {
          return { error: `Room ${args.room_number} not found` }
        }
        const result = await roomService.bookRoom(rooms[0].id, {
          date: args.date,
          start_time: args.start_time,
          end_time: args.end_time,
          booked_by: args.booked_by || userContext.name || "Student",
          user_id: userContext.user_id || userContext.id || "",
          purpose: args.purpose || ""
        })
        return { data: result.room, booking: result.booking }
      }

      case "register_event": {
        let eventId = args.event_id
        // Allow event_id to be either an id or matched by name
        if (!eventId && args.name) {
          const events = await eventService.listEvents({ organizer: args.name })
          if (events.length) eventId = events[0].id
        }
        if (!eventId) {
          return { error: "event_id is required" }
        }
        const result = await eventService.registerForEvent(eventId, {
          student_id: args.student_id || userContext.student_id,
          name: args.name || userContext.name,
          user_id: userContext.user_id || userContext.id || ""
        })
        return { data: result.event, registration: result.registration }
      }

      case "cancel_booking": {
        const rooms = await roomService.listRooms({ room_number: args.room_number })
        if (!rooms || rooms.length === 0) {
          return { error: `Room ${args.room_number} not found` }
        }
        const result = await roomService.cancelBooking(rooms[0].id, args.booking_id, userContext)
        return { data: result.room, message: "Booking cancelled successfully" }
      }

      case "cancel_event_registration": {
        const result = await eventService.cancelRegistration(
          args.event_id,
          args.registration_id,
          userContext
        )
        return { data: result.event, message: "Registration cancelled successfully" }
      }

      default:
        return { error: `Unknown tool: ${name}` }
    }
  } catch (err) {
    return { error: err.message, code: err.code }
  }
}
