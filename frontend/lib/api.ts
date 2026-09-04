const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export class ApiError extends Error {
  constructor(public status: number, public body: any) {
    super(body?.error || `HTTP ${status}`)
  }
}

async function request<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
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
  return res.json()
}

export const api = {
  // Schedules
  listSchedules: (q?: Record<string, string>) =>
    request(`/api/schedules${q ? `?${new URLSearchParams(q)}` : ""}`),
  createSchedule: (body: any) =>
    request(`/api/schedules`, { method: "POST", body: JSON.stringify(body) }),
  updateSchedule: (id: string, body: any) =>
    request(`/api/schedules/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteSchedule: (id: string) =>
    request(`/api/schedules/${id}`, { method: "DELETE" }),

  // Rooms
  listRooms: (q?: Record<string, string>) =>
    request(`/api/rooms${q ? `?${new URLSearchParams(q)}` : ""}`),
  createRoom: (body: any) =>
    request(`/api/rooms`, { method: "POST", body: JSON.stringify(body) }),
  updateRoom: (id: string, body: any) =>
    request(`/api/rooms/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteRoom: (id: string) =>
    request(`/api/rooms/${id}`, { method: "DELETE" }),
  bookRoom: (id: string, body: any) =>
    request(`/api/rooms/${id}/book`, { method: "POST", body: JSON.stringify(body) }),
  cancelBooking: (roomId: string, bookingId: string) =>
    request(`/api/rooms/${roomId}/book/${bookingId}`, { method: "DELETE" }),

  // Events
  listEvents: (q?: Record<string, string>) =>
    request(`/api/events${q ? `?${new URLSearchParams(q)}` : ""}`),
  createEvent: (body: any) =>
    request(`/api/events`, { method: "POST", body: JSON.stringify(body) }),
  updateEvent: (id: string, body: any) =>
    request(`/api/events/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteEvent: (id: string) =>
    request(`/api/events/${id}`, { method: "DELETE" }),
  registerEvent: (id: string, body: { student_id: string; name: string }) =>
    request(`/api/events/${id}/register`, { method: "POST", body: JSON.stringify(body) }),

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
  chat: (messages: { role: string; content: string }[]) =>
    request(`/api/agent/chat`, { method: "POST", body: JSON.stringify({ messages }) })
}
