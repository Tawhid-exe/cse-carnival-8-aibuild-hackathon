export const tools = [
  {
    type: "function",
    function: {
      name: "list_schedules",
      description: "List class schedules. Use when the user asks about classes, timetable, what's on a given day, or who's teaching.",
      parameters: {
        type: "object",
        properties: {
          day: { type: "string", enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] },
          course: { type: "string", description: "Course code e.g. CSE 4113" },
          instructor: { type: "string" },
          room: { type: "string" },
          section: { type: "string" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_rooms",
      description: "List rooms with optional filters. Use when user asks about available rooms, labs, or filtering by equipment/capacity.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["classroom", "lab", "seminar"] },
          min_capacity: { type: "number" },
          equipment: { type: "string", description: "e.g. projector, AC, whiteboard" },
          available_date: { type: "string", description: "YYYY-MM-DD" },
          available_start: { type: "string", description: "HH:MM" },
          available_end: { type: "string", description: "HH:MM" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_events",
      description: "List campus events. Use for 'what's happening', registration queries, or event details.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "YYYY-MM-DD" },
          status: { type: "string", enum: ["upcoming", "ongoing", "completed", "cancelled", "full"] },
          id: { type: "string", description: "Event id e.g. evt-001" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_announcements",
      description: "List announcements/notices. Use for 'any new notices?', priority filtering, or specific announcements.",
      parameters: {
        type: "object",
        properties: {
          priority: { type: "string", enum: ["high", "medium", "low"] }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_assignments",
      description: "List assignments. Use for 'what's due', course-specific work, or status queries.",
      parameters: {
        type: "object",
        properties: {
          course: { type: "string", description: "Course code" },
          status: { type: "string", enum: ["pending", "submitted", "graded", "late"] },
          deadline_before: { type: "string", description: "YYYY-MM-DD — returns assignments due before this date" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "book_room",
      description: "Book a room. Requires exact room_number (e.g. '7A02'). Date in YYYY-MM-DD, times in HH:MM. Refuses vague requests — if user doesn't specify time, ASK first.",
      parameters: {
        type: "object",
        required: ["room_number", "date", "start_time", "end_time", "booked_by", "purpose"],
        properties: {
          room_number: { type: "string" },
          date: { type: "string" },
          start_time: { type: "string" },
          end_time: { type: "string" },
          booked_by: { type: "string", description: "Name of the person booking" },
          purpose: { type: "string" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "register_event",
      description: "Register a user for an event by event id. Requires student_id and name from the request body.",
      parameters: {
        type: "object",
        required: ["event_id", "student_id", "name"],
        properties: {
          event_id: { type: "string", description: "Event id e.g. evt-001" },
          student_id: { type: "string", description: "Student ID e.g. 20-40532" },
          name: { type: "string", description: "Student name" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "cancel_booking",
      description: "Cancel a room booking by room_number and booking_id.",
      parameters: {
        type: "object",
        required: ["room_number", "booking_id"],
        properties: {
          room_number: { type: "string" },
          booking_id: { type: "string" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "cancel_event_registration",
      description: "Cancel an event registration using event_id and either registration_id or student_id.",
      parameters: {
        type: "object",
        required: ["event_id", "registration_id"],
        properties: {
          event_id: { type: "string", description: "Event id e.g. evt-001" },
          registration_id: { type: "string", description: "Registration ID (e.g. reg-123) or Student ID (e.g. 20-40532)" }
        }
      }
    }
  }
]
