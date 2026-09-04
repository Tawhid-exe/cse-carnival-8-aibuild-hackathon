const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export class ApiError extends Error {
  code?: string
  constructor(public status: number, public body: any) {
    super(body?.error || `HTTP ${status}`)
    this.code = body?.code
  }
}

async function request<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body)
  }
  if (res.status === 204) return undefined as T
  const json = await res.json()
  // Auto-unwrap standard backend envelope { data: ... }
  if (json && typeof json === "object" && "data" in json) {
    return json.data as T
  }
  return json as T
}

export const api = {
  // Schedules
  listSchedules: (q?: Record<string, string>) =>
    request(`/api/schedules${q ? `?${new URLSearchParams(q)}` : ""}`),
  createSchedule: (body: any) => {
    const payload = {
      course: body.course,
      title: body.title || body.course,
      day: body.day,
      start_time: body.start_time || body.start,
      end_time: body.end_time || body.end,
      room: body.room,
      instructor: body.instructor || "TBA",
      section: body.section || ""
    }
    return request(`/api/schedules`, { method: "POST", body: JSON.stringify(payload) })
  },
  updateSchedule: (id: string, body: any) => {
    const payload: any = {}
    if (body.course !== undefined) payload.course = body.course
    if (body.title !== undefined) payload.title = body.title
    else if (body.course !== undefined) payload.title = body.course
    if (body.day !== undefined) payload.day = body.day
    if (body.start_time || body.start) payload.start_time = body.start_time || body.start
    if (body.end_time || body.end) payload.end_time = body.end_time || body.end
    if (body.room !== undefined) payload.room = body.room
    if (body.instructor !== undefined) payload.instructor = body.instructor
    if (body.section !== undefined) payload.section = body.section
    return request(`/api/schedules/${id}`, { method: "PUT", body: JSON.stringify(payload) })
  },
  deleteSchedule: (id: string) =>
    request(`/api/schedules/${id}`, { method: "DELETE" }),

  // Rooms
  listRooms: (q?: Record<string, string>) =>
    request(`/api/rooms${q ? `?${new URLSearchParams(q)}` : ""}`),
  createRoom: (body: any) => {
    const payload = {
      room_number: body.room_number || body.number,
      type: body.type || "classroom",
      capacity: Number(body.capacity) || 30,
      floor: body.floor !== undefined ? Number(body.floor) : 1,
      equipment: Array.isArray(body.equipment) ? body.equipment : []
    }
    return request(`/api/rooms`, { method: "POST", body: JSON.stringify(payload) })
  },
  updateRoom: (id: string, body: any) => {
    const payload: any = { ...body }
    if (body.number && !body.room_number) payload.room_number = body.number
    if (body.capacity !== undefined) payload.capacity = Number(body.capacity)
    return request(`/api/rooms/${id}`, { method: "PUT", body: JSON.stringify(payload) })
  },
  deleteRoom: (id: string) =>
    request(`/api/rooms/${id}`, { method: "DELETE" }),
  bookRoom: (id: string, body: any) => {
    const payload = {
      date: body.date,
      start_time: body.start_time || body.start,
      end_time: body.end_time || body.end,
      booked_by: body.booked_by || body.userName || body.name || "Student",
      user_id: body.user_id || body.userId || "",
      purpose: body.purpose || ""
    }
    return request(`/api/rooms/${id}/book`, { method: "POST", body: JSON.stringify(payload) })
  },
  cancelBooking: (roomId: string, bookingId: string) =>
    request(`/api/rooms/${roomId}/book/${bookingId}`, { method: "DELETE" }),

  // Events
  listEvents: (q?: Record<string, string>) =>
    request(`/api/events${q ? `?${new URLSearchParams(q)}` : ""}`),
  createEvent: (body: any) => {
    const payload = {
      name: body.name,
      description: body.description || "",
      date: body.date,
      start_time: body.start_time || body.time || "10:00",
      end_time: body.end_time || "12:00",
      venue: body.venue || body.location || "Campus",
      organizer: body.organizer || "Campus",
      capacity: Number(body.capacity) || 50
    }
    return request(`/api/events`, { method: "POST", body: JSON.stringify(payload) })
  },
  updateEvent: (id: string, body: any) => {
    const payload: any = { ...body }
    if (body.location && !body.venue) payload.venue = body.location
    if (body.time && !body.start_time) payload.start_time = body.time
    if (body.capacity !== undefined) payload.capacity = Number(body.capacity)
    return request(`/api/events/${id}`, { method: "PUT", body: JSON.stringify(payload) })
  },
  deleteEvent: (id: string) =>
    request(`/api/events/${id}`, { method: "DELETE" }),
  registerEvent: (id: string, body: { student_id: string; name: string; user_id?: string }) =>
    request(`/api/events/${id}/register`, { method: "POST", body: JSON.stringify(body) }),
  cancelEventRegistration: (eventId: string, registrationId: string) =>
    request(`/api/events/${eventId}/register/${registrationId}`, { method: "DELETE" }),

  // Announcements
  listAnnouncements: (q?: Record<string, string>) =>
    request(`/api/announcements${q ? `?${new URLSearchParams(q)}` : ""}`),
  createAnnouncement: (body: any) =>
    request(`/api/announcements`, { method: "POST", body: JSON.stringify(body) }),
  updateAnnouncement: (id: string, body: any) =>
    request(`/api/announcements/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteAnnouncement: (id: string) =>
    request(`/api/announcements/${id}`, { method: "DELETE" }),

  // Assignments
  listAssignments: (q?: Record<string, string>) =>
    request(`/api/assignments${q ? `?${new URLSearchParams(q)}` : ""}`),
  createAssignment: (body: any) =>
    request(`/api/assignments`, { method: "POST", body: JSON.stringify(body) }),
  updateAssignment: (id: string, body: any) =>
    request(`/api/assignments/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteAssignment: (id: string) =>
    request(`/api/assignments/${id}`, { method: "DELETE" }),

  // Agent
  chat: (messages: { role: string; content: string }[], context?: { student_id?: string; name?: string; user_id?: string }) =>
    request(`/api/agent/chat`, { method: "POST", body: JSON.stringify({ messages, ...(context || {}) }) }),

  // Seed
  seed: (force: boolean = false) =>
    request(`/api/seed`, { method: "POST", body: JSON.stringify({ force }) })
}
