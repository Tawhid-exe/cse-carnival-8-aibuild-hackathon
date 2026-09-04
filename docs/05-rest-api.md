# 05 — REST API Reference

Base URL: `http://localhost:4000`
All `/api/*` routes (except `/api/auth/*`) require `Authorization: Bearer <jwt>`.

## Common shapes

**Success response (single):**
```json
{ "data": { ...record } }
```

**Success response (list):**
```json
{ "data": [ ...records ], "count": 24 }
```

**Error response:**
```json
{ "error": "Human-readable message" }
```

**Auth failure:** `401 { "error": "Auth required" }` or `401 { "error": "Invalid token" }`
**Ownership failure:** `403 { "error": "Not allowed" }`
**Validation failure:** `400 { "error": "Specific reason" }`
**Conflict:** `409 { "error": "Room already booked for that time" }` (etc.)
**Not found:** `404 { "error": "Schedule not found" }`

## Schedules — `/api/schedules`

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/api/schedules` | ✅ | — | List of all schedules. Query: `?day=Monday&course=CSE%204113` |
| GET | `/api/schedules/:id` | ✅ | — | Single schedule |
| POST | `/api/schedules` | ✅ | full record (no `id`) | Created schedule with generated `id` |
| PUT | `/api/schedules/:id` | ✅ | partial record | Updated schedule |
| DELETE | `/api/schedules/:id` | ✅ | — | `204 No Content` |

**Filters supported:** `day`, `course`, `instructor`, `room`, `section`.

## Rooms — `/api/rooms`

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/api/rooms` | ✅ | — | List of all rooms. Query: `?type=lab&min_capacity=30` |
| GET | `/api/rooms/:id` | ✅ | — | Single room (with bookings) |
| POST | `/api/rooms` | ✅ | full record (no `id`, no `bookings`) | Created room |
| PUT | `/api/rooms/:id` | ✅ | partial record | Updated room |
| DELETE | `/api/rooms/:id` | ✅ | — | `204 No Content` |
| POST | `/api/rooms/:id/book` | ✅ | `{ date, start_time, end_time, purpose }` | Updated room with new booking pushed to `bookings[]` |
| DELETE | `/api/rooms/:id/book/:bookingId` | ✅ | — | Updated room with booking removed. `403` if not the booker. |

**Booking validation:**
- `end_time > start_time`
- No time overlap with existing booking on same date → `409`
- `booked_by` and `booked_by_id` auto-filled from session — never accepted from client body

**Equipment filter:** `?equipment=projector` matches rooms whose `equipment[]` contains the value.

## Events — `/api/events`

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/api/events` | ✅ | — | List of all events. Query: `?date=2026-09-05&status=upcoming` |
| GET | `/api/events/:id` | ✅ | — | Single event (with registrations) |
| POST | `/api/events` | ✅ | full record | Created event |
| PUT | `/api/events/:id` | ✅ | partial record | Updated event |
| DELETE | `/api/events/:id` | ✅ | — | `204 No Content` |
| POST | `/api/events/:id/register` | ✅ | — (identity from session) | Updated event with new registration |
| DELETE | `/api/events/:id/register` | ✅ | — (identity from session) | Updated event with registration removed |

**Registration validation:**
- `student_id` already registered → `409 "Already registered"`
- `registrations.length >= capacity` → `409 "Event is full"`
- On success, `registered` is updated to match `registrations.length`
- `status` auto-flips to `"full"` when capacity reached (optional polish)

## Announcements — `/api/announcements`

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/api/announcements` | ✅ | — | List. Query: `?priority=high` |
| GET | `/api/announcements/:id` | ✅ | — | Single announcement |
| POST | `/api/announcements` | ✅ | full record | Created. `posted_by` auto-filled from session. |
| PUT | `/api/announcements/:id` | ✅ | partial record | Updated |
| DELETE | `/api/announcements/:id` | ✅ | — | `204 No Content` |

## Assignments — `/api/assignments`

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| GET | `/api/assignments` | ✅ | — | List. Query: `?course=CSE%204113&status=pending` |
| GET | `/api/assignments/:id` | ✅ | — | Single assignment |
| POST | `/api/assignments` | ✅ | full record | Created |
| PUT | `/api/assignments/:id` | ✅ | partial record | Updated |
| DELETE | `/api/assignments/:id` | ✅ | — | `204 No Content` |

## Agent — `/api/agent/chat`

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/api/agent/chat` | ✅ | `{ messages: [{ role, content }, ...] }` | `{ message: { role: "assistant", content: "..." }, tool_calls: [...] }` |

**Request shape:**
```json
{
  "messages": [
    { "role": "user", "content": "What's my next class?" }
  ]
}
```

**Response shape:**
```json
{
  "message": {
    "role": "assistant",
    "content": "Your next class is CSE 4113 on Sunday at 08:00 in 7A03."
  },
  "tool_calls": [
    { "tool": "list_schedules", "args": { "day": "Sunday" } }
  ]
}
```

`tool_calls` is included for transparency — frontend may render a small "Used tool: list_schedules" indicator under the bubble.

## Auth — Better Auth catch-all

`/api/auth/*` is handled by Better Auth's `[...all]` route in Next.js (not the Express backend). It serves:
- `/api/auth/sign-up/email` — create account
- `/api/auth/sign-in/email` — login
- `/api/auth/sign-out` — logout
- `/api/auth/session` — get current session
- etc.

The frontend handles all auth flows; the backend only verifies the resulting JWT.

## Query parameter summary

| Param | Applies to | Effect |
|---|---|---|
| `day` | schedules | exact match on `day` field |
| `course` | schedules, assignments | exact match |
| `instructor` | schedules | exact match |
| `room` | schedules | exact match on `room` field |
| `section` | schedules | exact match |
| `type` | rooms | exact match (`classroom`/`lab`/`seminar`) |
| `min_capacity` | rooms | rooms with `capacity >= N` |
| `equipment` | rooms | rooms whose `equipment[]` contains the value |
| `date` | events | exact match on `date` |
| `status` | events, announcements, assignments | exact match |
| `priority` | announcements | exact match |
| `deadline_before` | assignments | ISO date string; returns assignments with `deadline < value` |

Multiple filters combine with AND.
