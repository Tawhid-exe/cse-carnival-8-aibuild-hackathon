const VALID_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]
const VALID_ROOM_TYPES = ["classroom", "lab", "seminar"]
const VALID_EVENT_STATUSES = ["upcoming", "ongoing", "completed", "cancelled", "full"]
const VALID_PRIORITIES = ["high", "medium", "low"]
const VALID_ASSIGNMENT_STATUSES = ["pending", "submitted", "graded", "late"]

export function validateSchedule(body, method = "POST") {
  if (method === "POST") {
    if (!body.course) return "course is required"
    if (!body.title) return "title is required"
    if (!body.day) return "day is required"
    if (!VALID_DAYS.includes(body.day)) return `day must be one of: ${VALID_DAYS.join(", ")}`
    if (!body.start_time) return "start_time is required"
    if (!body.end_time) return "end_time is required"
    if (!body.room) return "room is required"
  } else if (method === "PUT") {
    if (body.day && !VALID_DAYS.includes(body.day)) return `day must be one of: ${VALID_DAYS.join(", ")}`
  }
  return null
}

export function validateRoom(body, method = "POST") {
  if (method === "POST") {
    if (!body.room_number) return "room_number is required"
    if (!body.type) return "type is required"
    if (!VALID_ROOM_TYPES.includes(body.type)) return `type must be one of: ${VALID_ROOM_TYPES.join(", ")}`
    if (body.capacity === undefined || body.capacity === null) return "capacity is required"
    if (typeof body.capacity !== "number" || body.capacity <= 0) return "capacity must be a positive number"
    if (body.floor === undefined || body.floor === null) return "floor is required"
  } else if (method === "PUT") {
    if (body.type && !VALID_ROOM_TYPES.includes(body.type)) return `type must be one of: ${VALID_ROOM_TYPES.join(", ")}`
    if (body.capacity !== undefined && (typeof body.capacity !== "number" || body.capacity <= 0)) {
      return "capacity must be a positive number"
    }
  }
  return null
}

export function validateBooking(body) {
  if (!body.date) return "date is required (YYYY-MM-DD)"
  if (!body.start_time) return "start_time is required (HH:MM)"
  if (!body.end_time) return "end_time is required (HH:MM)"
  if (!body.booked_by) return "booked_by is required"
  if (body.start_time >= body.end_time) return "start_time must be earlier than end_time"
  return null
}

export function validateEvent(body, method = "POST") {
  if (method === "POST") {
    if (!body.name) return "name is required"
    if (!body.date) return "date is required (YYYY-MM-DD)"
    if (!body.start_time) return "start_time is required (HH:MM)"
    if (!body.end_time) return "end_time is required (HH:MM)"
    if (!body.venue) return "venue is required"
    if (body.capacity === undefined || body.capacity === null) return "capacity is required"
    if (typeof body.capacity !== "number" || body.capacity <= 0) return "capacity must be a positive number"
  } else if (method === "PUT") {
    if (body.status && !VALID_EVENT_STATUSES.includes(body.status)) {
      return `status must be one of: ${VALID_EVENT_STATUSES.join(", ")}`
    }
    if (body.capacity !== undefined && (typeof body.capacity !== "number" || body.capacity <= 0)) {
      return "capacity must be a positive number"
    }
  }
  return null
}

export function validateRegistration(body) {
  if (!body.student_id) return "student_id is required"
  if (!body.name) return "name is required"
  return null
}

export function validateAnnouncement(body, method = "POST") {
  if (method === "POST") {
    if (!body.title) return "title is required"
    if (!body.priority) return "priority is required"
    if (!VALID_PRIORITIES.includes(body.priority)) return `priority must be one of: ${VALID_PRIORITIES.join(", ")}`
  } else if (method === "PUT") {
    if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
      return `priority must be one of: ${VALID_PRIORITIES.join(", ")}`
    }
  }
  return null
}

export function validateAssignment(body, method = "POST") {
  if (method === "POST") {
    if (!body.course) return "course is required"
    if (!body.title) return "title is required"
    if (!body.deadline) return "deadline is required"
  } else if (method === "PUT") {
    if (body.status && !VALID_ASSIGNMENT_STATUSES.includes(body.status)) {
      return `status must be one of: ${VALID_ASSIGNMENT_STATUSES.join(", ")}`
    }
  }
  return null
}
