# CampusOS — Backend API Documentation

> **Stack contract:** Express.js (or Fastify) on `http://localhost:4000`. All requests/responses are `application/json`. Auth is handled by **Better Auth** on the Next.js frontend (`http://localhost:3000/api/auth/*`). The backend trusts the session token forwarded in the `Authorization: Bearer <token>` header or the `better-auth.session_token` cookie forwarded by the client.

---

## Table of Contents

1. [Base URL & Conventions](#base-url--conventions)
2. [Authentication Flow](#authentication-flow)
3. [Error Schema](#error-schema)
4. [Schedules API](#1-schedules-api)
5. [Rooms API](#2-rooms-api)
6. [Events API](#3-events-api)
7. [Announcements API](#4-announcements-api)
8. [Assignments API](#5-assignments-api)
9. [AI Agent API](#6-ai-agent-api)
10. [Seed Endpoint](#7-seed-endpoint)
11. [Data Schemas (Quick Reference)](#data-schemas-quick-reference)
12. [Auth Header Guide](#auth-header-guide)

---

## Base URL & Conventions

```
Base URL : http://localhost:4000
Prefix   : /api
```

| Convention | Details |
|---|---|
| **Dates** | ISO 8601 `"YYYY-MM-DD"` |
| **Times** | 24-hour `"HH:MM"` |
| **IDs** | String, stable primary key (e.g. `"sch-001"`, `"room-001"`) |
| **Auth** | `Authorization: Bearer <session_token>` on protected routes |
| **Pagination** | Not required for hackathon scope — all lists return full arrays |
| **Filtering** | Via query params |
| **Success** | `200 OK` (list/get/update), `201 Created` (POST), `204 No Content` (DELETE) |

---

## Authentication Flow

Better Auth runs on the **Next.js** frontend. The backend only **validates** sessions by calling the Better Auth session verification endpoint (or by sharing the MongoDB session collection).

### How the frontend passes auth to the backend

Every protected API call from `lib/api.ts` must forward the session cookie or token:

```typescript
// lib/api.ts — add credentials to every request
const res = await fetch(`${API_BASE}${path}`, {
  ...init,
  credentials: "include",           // forwards the session cookie
  headers: {
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  },
  cache: "no-store",
})
```

### Backend session validation middleware

The backend resolves the current user on every request using the Better Auth introspection endpoint or shared session store.

```
POST http://localhost:3000/api/auth/get-session
Cookie: better-auth.session_token=<token>
```

Response shape used internally:
```json
{
  "user": {
    "id": "user_abc123",
    "email": "student@aust.edu",
    "name": "Mahtab",
    "role": "student"
  },
  "session": { ... }
}
```

### Role Guard Summary

| Route pattern | Minimum role |
|---|---|
| All `GET` list/detail endpoints | `student` (authenticated) |
| `POST/PUT/DELETE` on schedules, rooms, events, announcements, assignments | `admin` |
| `POST /api/rooms/:id/book` | `student` |
| `DELETE /api/rooms/:id/book/:bookingId` | owner **or** `admin` |
| `POST /api/events/:id/register` | `student` |
| `DELETE /api/events/:id/register/:registrationId` | owner **or** `admin` |
| `POST /api/agent/chat` | `student` |
| `POST /api/seed` | `admin` |

---

## Error Schema

All errors return a consistent JSON body:

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE"
}
```

### Common error codes

| HTTP | `code` | Meaning |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Missing or malformed fields |
| `401` | `UNAUTHORIZED` | No valid session |
| `403` | `FORBIDDEN` | Valid session but insufficient role |
| `404` | `NOT_FOUND` | Resource does not exist |
| `409` | `CONFLICT` | Booking/registration conflict |
| `422` | `CAPACITY_EXCEEDED` | Event is full |
| `500` | `INTERNAL_ERROR` | Unhandled server error |

---

## 1. Schedules API

Base path: `/api/schedules`

### 1.1 List all schedules

```
GET /api/schedules
```

**Auth:** required (student+)

**Query parameters (all optional):**

| Param | Type | Description |
|---|---|---|
| `day` | `string` | Filter by day: `Sunday` / `Monday` / `Tuesday` / `Wednesday` / `Thursday` |
| `course` | `string` | Filter by course code, case-insensitive substring match (e.g. `CSE 4113`) |
| `room` | `string` | Filter by room number (e.g. `7A03`) |
| `instructor` | `string` | Substring match on instructor name |

**Example request:**
```
GET /api/schedules?day=Sunday&course=CSE
```

**Response 200 OK:**
```json
[
  {
    "_id": "sch-001",
    "course": "CSE 4113",
    "title": "Pattern Recognition and Machine Learning",
    "day": "Sunday",
    "start_time": "13:00",
    "end_time": "13:50",
    "room": "7A07",
    "instructor": "Prof. Dr. Md. Shahriar Mahbub",
    "section": "B"
  }
]
```

---

### 1.2 Get single schedule

```
GET /api/schedules/:id
```

**Auth:** required (student+)

**Response 200 OK:**
```json
{
  "_id": "sch-001",
  "course": "CSE 4113",
  "title": "Pattern Recognition and Machine Learning",
  "day": "Sunday",
  "start_time": "13:00",
  "end_time": "13:50",
  "room": "7A07",
  "instructor": "Prof. Dr. Md. Shahriar Mahbub",
  "section": "B"
}
```

**Error:** `404 NOT_FOUND` if `id` does not exist.

---

### 1.3 Create schedule

```
POST /api/schedules
```

**Auth:** required (`admin`)

**Request body:**
```json
{
  "course": "CSE 4113",
  "title": "Pattern Recognition and Machine Learning",
  "day": "Sunday",
  "start_time": "13:00",
  "end_time": "13:50",
  "room": "7A07",
  "instructor": "Prof. Dr. Md. Shahriar Mahbub",
  "section": "B"
}
```

**Required fields:** `course`, `title`, `day`, `start_time`, `end_time`, `room`, `section`
**Optional fields:** `instructor` (defaults to `"TBA"`)

**Response 201 Created:**
```json
{
  "_id": "sch-025",
  "course": "CSE 4113",
  "title": "Pattern Recognition and Machine Learning",
  "day": "Sunday",
  "start_time": "13:00",
  "end_time": "13:50",
  "room": "7A07",
  "instructor": "Prof. Dr. Md. Shahriar Mahbub",
  "section": "B"
}
```

---

### 1.4 Update schedule

```
PUT /api/schedules/:id
```

**Auth:** required (`admin`)

**Request body** (all fields optional — partial update):
```json
{
  "instructor": "Dr. New Instructor",
  "room": "7A04",
  "start_time": "14:00",
  "end_time": "14:50"
}
```

**Response 200 OK:** Returns updated document (same shape as GET single).

**Error:** `404 NOT_FOUND` if `id` does not exist.

---

### 1.5 Delete schedule

```
DELETE /api/schedules/:id
```

**Auth:** required (`admin`)

**Response 204 No Content:** Empty body.

**Error:** `404 NOT_FOUND` if `id` does not exist.

---

## 2. Rooms API

Base path: `/api/rooms`

### 2.1 List all rooms

```
GET /api/rooms
```

**Auth:** required (student+)

**Query parameters (all optional):**

| Param | Type | Description |
|---|---|---|
| `type` | `string` | `classroom` / `lab` / `seminar` |
| `min_capacity` | `number` | Minimum capacity (inclusive) |
| `equipment` | `string` | Comma-separated list — room must have **all** listed items (e.g. `projector,AC`) |
| `date` | `string` | `YYYY-MM-DD` — filter to show rooms available on this date |
| `start_time` | `string` | `HH:MM` — combined with `date`, find rooms free from this time |
| `end_time` | `string` | `HH:MM` — combined with `date`, find rooms free until this time |
| `status` | `string` | `available` / `unavailable` |

> **Availability logic:** When `date`, `start_time`, and `end_time` are all provided, return only rooms whose `bookings` array has **no overlap** with the requested window on that date. Overlap condition: `booking.date == date && booking.start_time < end_time && booking.end_time > start_time`.

**Example request:**
```
GET /api/rooms?date=2026-09-07&start_time=13:00&end_time=15:00&min_capacity=40&equipment=projector,AC
```

**Response 200 OK:**
```json
[
  {
    "_id": "room-001",
    "room_number": "7A01",
    "type": "classroom",
    "capacity": 40,
    "equipment": ["whiteboard", "projector", "AC"],
    "floor": 7,
    "status": "available",
    "bookings": []
  }
]
```

---

### 2.2 Get single room

```
GET /api/rooms/:id
```

**Auth:** required (student+)

**Response 200 OK:**
```json
{
  "_id": "room-006",
  "room_number": "7A06",
  "type": "classroom",
  "capacity": 40,
  "equipment": ["whiteboard", "projector", "AC"],
  "floor": 7,
  "status": "available",
  "bookings": [
    {
      "booking_id": "bk-001",
      "booked_by": "Nusrat Jahan",
      "user_id": "user_abc123",
      "date": "2026-09-07",
      "start_time": "13:00",
      "end_time": "14:40",
      "purpose": "CSE 4129 Extra Class"
    }
  ]
}
```

> **Note:** Backend must store `user_id` (from session) on each booking to enable owner-based cancellation.

---

### 2.3 Create room

```
POST /api/rooms
```

**Auth:** required (`admin`)

**Request body:**
```json
{
  "room_number": "7A08",
  "type": "classroom",
  "capacity": 45,
  "equipment": ["whiteboard", "projector", "AC"],
  "floor": 7,
  "status": "available"
}
```

**Required fields:** `room_number`, `type`, `capacity`, `floor`
**Optional fields:** `equipment` (defaults `[]`), `status` (defaults `"available"`)

**Response 201 Created:** Returns full room document including empty `bookings: []`.

**Error:** `409 CONFLICT` if `room_number` already exists.

---

### 2.4 Update room

```
PUT /api/rooms/:id
```

**Auth:** required (`admin`)

**Request body** (partial update — all optional):
```json
{
  "capacity": 50,
  "status": "unavailable",
  "equipment": ["whiteboard", "projector", "AC", "smart board"]
}
```

**Response 200 OK:** Returns updated room document.

---

### 2.5 Delete room

```
DELETE /api/rooms/:id
```

**Auth:** required (`admin`)

**Response 204 No Content.**

---

### 2.6 Book a room

```
POST /api/rooms/:id/book
```

**Auth:** required (student+)

**Request body:**
```json
{
  "date": "2026-09-10",
  "start_time": "14:00",
  "end_time": "16:00",
  "purpose": "Study group for CSE 4113"
}
```

**Required fields:** `date`, `start_time`, `end_time`, `purpose`

**Backend logic:**
1. Resolve `booked_by` from session user name and store `user_id` from session.
2. Check for any booking where `booking.date == date && booking.start_time < end_time && booking.end_time > start_time`.
3. If conflict: return `409 CONFLICT`.
4. If room `status == "unavailable"`: return `409 CONFLICT`.
5. Generate a new `booking_id` (e.g. `bk-<timestamp>`).
6. Push new booking into the room's `bookings` array.

**Response 201 Created:**
```json
{
  "booking_id": "bk-1725432000000",
  "room_id": "room-001",
  "room_number": "7A01",
  "booked_by": "Mahtab",
  "user_id": "user_abc123",
  "date": "2026-09-10",
  "start_time": "14:00",
  "end_time": "16:00",
  "purpose": "Study group for CSE 4113"
}
```

**Errors:**
- `404 NOT_FOUND` — room does not exist
- `409 CONFLICT` — time slot already booked or room unavailable

---

### 2.7 Cancel a room booking

```
DELETE /api/rooms/:id/book/:bookingId
```

**Auth:** required (owner or `admin`)

**Backend logic:**
1. Find the room and the booking inside `bookings[]` by `booking_id`.
2. Check session `user_id` matches `booking.user_id` OR session role is `admin`.
3. If not: return `403 FORBIDDEN`.
4. Pull the booking from the array.

**Response 204 No Content.**

**Errors:**
- `404 NOT_FOUND` — room or booking does not exist
- `403 FORBIDDEN` — not the owner and not admin

---

## 3. Events API

Base path: `/api/events`

### 3.1 List all events

```
GET /api/events
```

**Auth:** required (student+)

**Query parameters (all optional):**

| Param | Type | Description |
|---|---|---|
| `status` | `string` | `upcoming` / `ongoing` / `completed` / `cancelled` / `full` |
| `date` | `string` | `YYYY-MM-DD` — events on this date |
| `organizer` | `string` | Substring match |
| `venue` | `string` | Exact room number match |

**Response 200 OK:**
```json
[
  {
    "_id": "evt-001",
    "name": "AI Workshop",
    "description": "Hands-on session on LLMs",
    "date": "2026-09-10",
    "start_time": "10:00",
    "end_time": "13:00",
    "end_date": "2026-09-10",
    "venue": "7C01",
    "organizer": "AUSTPIC",
    "capacity": 60,
    "registered": 14,
    "registrations": [
      {
        "registration_id": "reg-001",
        "student_id": "20-40532",
        "name": "Mahtab",
        "user_id": "user_abc123"
      }
    ],
    "status": "upcoming"
  }
]
```

> **Note:** `registered` must be kept in sync with `registrations.length` on every register/cancel action.

---

### 3.2 Get single event

```
GET /api/events/:id
```

**Auth:** required (student+)

**Response 200 OK:** Same shape as one item from list, full `registrations` array included.

---

### 3.3 Create event

```
POST /api/events
```

**Auth:** required (`admin`)

**Request body:**
```json
{
  "name": "AI Workshop",
  "description": "Hands-on session on LLMs and prompt engineering",
  "date": "2026-09-10",
  "start_time": "10:00",
  "end_time": "13:00",
  "end_date": "2026-09-10",
  "venue": "7C01",
  "organizer": "AUSTPIC",
  "capacity": 60,
  "status": "upcoming"
}
```

**Required fields:** `name`, `date`, `start_time`, `end_time`, `venue`, `organizer`, `capacity`
**Optional fields:** `description` (defaults `""`), `end_date` (defaults to `date`), `status` (defaults `"upcoming"`)

**Response 201 Created:** Returns full event document with `registered: 0`, `registrations: []`.

---

### 3.4 Update event

```
PUT /api/events/:id
```

**Auth:** required (`admin`)

**Request body** (partial — all fields optional):
```json
{
  "capacity": 80,
  "status": "ongoing",
  "venue": "7C05"
}
```

**Response 200 OK:** Returns updated event document.

---

### 3.5 Delete event

```
DELETE /api/events/:id
```

**Auth:** required (`admin`)

**Response 204 No Content.**

---

### 3.6 Register for an event

```
POST /api/events/:id/register
```

**Auth:** required (student+)

**Request body:**
```json
{
  "student_id": "20-40532",
  "name": "Mahtab Azmaeen"
}
```

**Required fields:** `student_id`, `name`

**Backend logic:**
1. Resolve `user_id` from session — store alongside registration.
2. Check `registered >= capacity`: return `422 CAPACITY_EXCEEDED`.
3. Check if `student_id` already in `registrations[]`: return `409 CONFLICT`.
4. Check event `status` is not `"cancelled"` or `"completed"`: return `400 VALIDATION_ERROR`.
5. Generate `registration_id`, push registration, increment `registered`.
6. Set `status = "full"` if `registered == capacity` after insert.

**Response 201 Created:**
```json
{
  "registration_id": "reg-1725432000000",
  "event_id": "evt-001",
  "event_name": "AI Workshop",
  "student_id": "20-40532",
  "name": "Mahtab Azmaeen",
  "user_id": "user_abc123"
}
```

**Errors:**
- `404 NOT_FOUND` — event does not exist
- `409 CONFLICT` — already registered
- `422 CAPACITY_EXCEEDED` — event is full

---

### 3.7 Cancel event registration

```
DELETE /api/events/:id/register/:registrationId
```

**Auth:** required (owner or `admin`)

**Backend logic:**
1. Find the registration by `registration_id` in `registrations[]`.
2. Check session `user_id` == `registration.user_id` OR role is `admin`.
3. Pull registration, decrement `registered`.
4. Re-evaluate status (e.g. revert from `"full"` to `"upcoming"` if capacity freed).

**Response 204 No Content.**

**Errors:**
- `404 NOT_FOUND` — event or registration does not exist
- `403 FORBIDDEN` — not owner and not admin

---

## 4. Announcements API

Base path: `/api/announcements`

### 4.1 List all announcements

```
GET /api/announcements
```

**Auth:** required (student+)

**Query parameters (all optional):**

| Param | Type | Description |
|---|---|---|
| `priority` | `string` | `high` / `medium` / `low` |
| `sort` | `string` | `date_asc` / `date_desc` (default) / `priority_asc` / `priority_desc` |
| `active` | `boolean` | If `true`, only return where `expires >= today` |

> Priority sort order: `high > medium > low`

**Response 200 OK:**
```json
[
  {
    "_id": "ann-001",
    "title": "Semester Final Exam Schedule Released",
    "body": "The final exam schedule for Fall 2026 is now available on the notice board.",
    "date": "2026-09-01",
    "priority": "high",
    "posted_by": "Academic Office",
    "expires": "2026-09-20"
  }
]
```

---

### 4.2 Get single announcement

```
GET /api/announcements/:id
```

**Auth:** required (student+)

**Response 200 OK:** Same shape as list item.

---

### 4.3 Create announcement

```
POST /api/announcements
```

**Auth:** required (`admin`)

**Request body:**
```json
{
  "title": "Campus Wi-Fi Maintenance",
  "body": "Campus Wi-Fi will be down on Saturday 5th September from 10:00-14:00 for scheduled maintenance.",
  "date": "2026-09-04",
  "priority": "medium",
  "posted_by": "IT Department",
  "expires": "2026-09-06"
}
```

**Required fields:** `title`, `body`, `priority`
**Optional fields:** `date` (defaults to today), `posted_by` (defaults to session user name), `expires`

**Validation:** `priority` must be `"high"`, `"medium"`, or `"low"`.

**Response 201 Created:** Returns full announcement document.

---

### 4.4 Update announcement

```
PUT /api/announcements/:id
```

**Auth:** required (`admin`)

**Request body** (partial — all fields optional):
```json
{
  "priority": "high",
  "expires": "2026-09-10",
  "body": "Updated announcement text."
}
```

**Response 200 OK:** Returns updated document.

---

### 4.5 Delete announcement

```
DELETE /api/announcements/:id
```

**Auth:** required (`admin`)

**Response 204 No Content.**

---

## 5. Assignments API

Base path: `/api/assignments`

### 5.1 List all assignments

```
GET /api/assignments
```

**Auth:** required (student+)

**Query parameters (all optional):**

| Param | Type | Description |
|---|---|---|
| `course` | `string` | Course code substring match (e.g. `CSE 4113`) |
| `status` | `string` | `pending` / `submitted` / `graded` / `late` |
| `due_this_week` | `boolean` | If `true`, return only where `deadline` falls within the current Sun-Thu week |
| `sort` | `string` | `deadline_asc` (default) / `deadline_desc` |

**Response 200 OK:**
```json
[
  {
    "_id": "asgn-001",
    "course": "CSE 4113",
    "course_title": "Pattern Recognition and Machine Learning",
    "title": "Assignment 1: Perceptron Implementation",
    "description": "Implement a multi-layer perceptron from scratch using NumPy.",
    "assigned_date": "2026-08-28",
    "deadline": "2026-09-07",
    "submission_platform": "Google Classroom",
    "status": "pending",
    "marks": 20
  }
]
```

---

### 5.2 Get single assignment

```
GET /api/assignments/:id
```

**Auth:** required (student+)

**Response 200 OK:** Same shape as list item.

---

### 5.3 Create assignment

```
POST /api/assignments
```

**Auth:** required (`admin`)

**Request body:**
```json
{
  "course": "CSE 4113",
  "course_title": "Pattern Recognition and Machine Learning",
  "title": "Assignment 2: CNN Classifier",
  "description": "Build a CNN image classifier using PyTorch on CIFAR-10.",
  "assigned_date": "2026-09-05",
  "deadline": "2026-09-19",
  "submission_platform": "Google Classroom",
  "status": "pending",
  "marks": 30
}
```

**Required fields:** `course`, `title`, `deadline`
**Optional fields:** `course_title` (defaults `""`), `description` (defaults `""`), `assigned_date` (defaults to today), `submission_platform` (defaults `""`), `status` (defaults `"pending"`), `marks` (defaults `0`)

**Validation:** `status` must be `"pending"`, `"submitted"`, `"graded"`, or `"late"`.

**Response 201 Created:** Returns full assignment document.

---

### 5.4 Update assignment

```
PUT /api/assignments/:id
```

**Auth:** required (`admin`)

**Request body** (partial — all optional):
```json
{
  "status": "submitted",
  "deadline": "2026-09-21"
}
```

**Response 200 OK:** Returns updated document.

---

### 5.5 Delete assignment

```
DELETE /api/assignments/:id
```

**Auth:** required (`admin`)

**Response 204 No Content.**

---

## 6. AI Agent API

Base path: `/api/agent`

The agent is a server-side LLM (Gemini / GPT-4o) with tool-calling capabilities. The backend exposes all DB collections as tools and handles the orchestration loop. The frontend sends the entire message history on each turn for statelessness.

### 6.1 Chat

```
POST /api/agent/chat
```

**Auth:** required (student+)

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "What's my next class today?" },
    { "role": "assistant", "content": "Looking that up..." },
    { "role": "user", "content": "Also, is room 7A03 free at 3pm?" }
  ]
}
```

**Fields:**
- `messages` — full conversation history array (OpenAI-compatible format)
  - `role`: `"user"` / `"assistant"` / `"tool"`
  - `content`: `string`

**Response 200 OK:**
```json
{
  "reply": "Your next class today (Thursday) is CSE 4141 Data Warehousing and Mining at 09:40 in room 7A03 with Mr. Saha Reno.\n\nRoom 7A03 at 15:00 on Thursday: it's free — no bookings conflict with that slot.",
  "tool_calls": [
    {
      "tool": "get_schedules",
      "args": { "day": "Thursday" },
      "result_summary": "Found 6 classes on Thursday"
    },
    {
      "tool": "check_room_availability",
      "args": {
        "room_number": "7A03",
        "date": "2026-09-04",
        "start_time": "15:00",
        "end_time": "16:00"
      },
      "result_summary": "Room is available"
    }
  ]
}
```

**Response fields:**

| Field | Type | Description |
|---|---|---|
| `reply` | `string` | Final natural-language answer |
| `tool_calls` | `array` | Ordered list of every tool call made (for trace UI) |
| `tool_calls[].tool` | `string` | Internal tool name |
| `tool_calls[].args` | `object` | Arguments passed to the tool |
| `tool_calls[].result_summary` | `string` | Short human-readable summary of the tool result |

### Agent Tools (internal — not directly callable by frontend)

| Tool name | Description |
|---|---|
| `get_schedules` | Query schedule collection with optional day/course/room filters |
| `get_rooms` | Query rooms with optional availability filters |
| `get_room_by_number` | Get a specific room by room_number |
| `check_room_availability` | Check if a specific room is free at a date/time window |
| `book_room` | Book a room — validates availability first |
| `cancel_booking` | Cancel a room booking by booking_id |
| `get_events` | List events with optional status/date filter |
| `register_for_event` | Register the current user for an event |
| `cancel_event_registration` | Cancel a registration by registration_id |
| `get_announcements` | List announcements with optional priority filter |
| `get_assignments` | List assignments with optional due_this_week / status filter |

### Agent system-prompt behavior rules

1. **Never guess** a time, room, or date — always ask for clarification on vague requests.
2. **Always read from DB** at query time — never use stale context from earlier messages.
3. **Validate before mutating** — check availability/capacity before booking/registering.
4. **Inject current datetime** into the system prompt so "next class" and "due this week" resolve correctly.
5. **Refuse** requests that would operate on another user's data (e.g. "cancel Mahtab's booking" when caller is not Mahtab).
6. **Scope mutations** (book/cancel/register) to the currently authenticated user only.
7. **Surface errors naturally** — if the backend returns a conflict, explain it in plain language.

---

## 7. Seed Endpoint

```
POST /api/seed
```

**Auth:** required (`admin`)

**Request body (optional):**
```json
{
  "force": false
}
```

- `force: false` (default) — only seeds if each collection is currently empty.
- `force: true` — drops and re-seeds all five collections from scratch.

**Response 200 OK:**
```json
{
  "message": "Seeded successfully",
  "counts": {
    "schedules": 24,
    "rooms": 20,
    "events": 5,
    "announcements": 6,
    "assignments": 8
  }
}
```

Seed script reads from: `data/schedules.json`, `data/rooms.json`, `data/events.json`, `data/announcements.json`, `data/assignments.json`.

---

## Data Schemas (Quick Reference)

### Schedule document (MongoDB)
```ts
{
  _id: string,          // seeded id "sch-001" or auto-generated
  course: string,       // "CSE 4113"
  title: string,
  day: "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday",
  start_time: string,   // "HH:MM"
  end_time: string,     // "HH:MM"
  room: string,         // room_number e.g. "7A07"
  instructor: string,   // name or "TBA"
  section: string,      // "B", "B1/B2", "DWM", etc.
}
```

### Room document (MongoDB)
```ts
{
  _id: string,
  room_number: string,
  type: "classroom" | "lab" | "seminar",
  capacity: number,
  equipment: string[],
  floor: number,
  status: "available" | "unavailable",
  bookings: {
    booking_id: string,
    booked_by: string,    // display name from session
    user_id: string,      // Better Auth user.id for ownership checks
    date: string,         // "YYYY-MM-DD"
    start_time: string,   // "HH:MM"
    end_time: string,     // "HH:MM"
    purpose: string,
  }[],
}
```

### Event document (MongoDB)
```ts
{
  _id: string,
  name: string,
  description: string,
  date: string,           // "YYYY-MM-DD"
  start_time: string,
  end_time: string,
  end_date: string,
  venue: string,          // room_number
  organizer: string,
  capacity: number,
  registered: number,     // keep in sync with registrations.length
  registrations: {
    registration_id: string,
    student_id: string,   // e.g. "20-40532"
    name: string,
    user_id: string,      // Better Auth user.id
  }[],
  status: "upcoming" | "ongoing" | "completed" | "cancelled" | "full",
}
```

### Announcement document (MongoDB)
```ts
{
  _id: string,
  title: string,
  body: string,
  date: string,           // "YYYY-MM-DD"
  priority: "high" | "medium" | "low",
  posted_by: string,
  expires: string,        // "YYYY-MM-DD"
}
```

### Assignment document (MongoDB)
```ts
{
  _id: string,
  course: string,
  course_title: string,
  title: string,
  description: string,
  assigned_date: string,  // "YYYY-MM-DD"
  deadline: string,       // "YYYY-MM-DD"
  submission_platform: string,
  status: "pending" | "submitted" | "graded" | "late",
  marks: number,
}
```

---

## Auth Header Guide

### Updating `lib/api.ts` — add `credentials: "include"`

```ts
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

async function request<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",   // ← REQUIRED — forwards the session cookie
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}
```

### Backend CORS config (Express)

```ts
// backend/src/index.ts
import cors from "cors"

app.use(cors({
  origin: "http://localhost:3000",   // Next.js frontend origin
  credentials: true,                  // allows cookie forwarding
}))
```

### Backend auth middleware (Express example)

```ts
// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from "express"

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const cookie = req.headers.cookie || ""

  const sessionRes = await fetch("http://localhost:3000/api/auth/get-session", {
    headers: { cookie },
  })

  if (!sessionRes.ok) {
    return res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" })
  }

  const data = await sessionRes.json()
  if (!data?.user) {
    return res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED" })
  }

  req.user = data.user   // { id, email, name, role }
  next()
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" })
  }
  next()
}
```

> Add `user` to Express's `Request` type via a `types/express.d.ts` declaration file:
> ```ts
> // backend/src/types/express.d.ts
> declare namespace Express {
>   interface Request {
>     user?: { id: string; email: string; name: string; role: string }
>   }
> }
> ```

---

## Endpoint Summary Table

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/schedules` | student | List / filter schedules |
| `GET` | `/api/schedules/:id` | student | Get single schedule |
| `POST` | `/api/schedules` | admin | Create schedule |
| `PUT` | `/api/schedules/:id` | admin | Update schedule |
| `DELETE` | `/api/schedules/:id` | admin | Delete schedule |
| `GET` | `/api/rooms` | student | List / filter rooms + availability check |
| `GET` | `/api/rooms/:id` | student | Get room with bookings |
| `POST` | `/api/rooms` | admin | Create room |
| `PUT` | `/api/rooms/:id` | admin | Update room |
| `DELETE` | `/api/rooms/:id` | admin | Delete room |
| `POST` | `/api/rooms/:id/book` | student | Book a room (conflict prevention) |
| `DELETE` | `/api/rooms/:id/book/:bookingId` | owner / admin | Cancel a room booking |
| `GET` | `/api/events` | student | List / filter events |
| `GET` | `/api/events/:id` | student | Get event with registrations |
| `POST` | `/api/events` | admin | Create event |
| `PUT` | `/api/events/:id` | admin | Update event |
| `DELETE` | `/api/events/:id` | admin | Delete event |
| `POST` | `/api/events/:id/register` | student | Register for event (capacity enforced) |
| `DELETE` | `/api/events/:id/register/:registrationId` | owner / admin | Cancel registration |
| `GET` | `/api/announcements` | student | List / filter announcements |
| `GET` | `/api/announcements/:id` | student | Get announcement |
| `POST` | `/api/announcements` | admin | Create announcement |
| `PUT` | `/api/announcements/:id` | admin | Update announcement |
| `DELETE` | `/api/announcements/:id` | admin | Delete announcement |
| `GET` | `/api/assignments` | student | List / filter assignments |
| `GET` | `/api/assignments/:id` | student | Get assignment |
| `POST` | `/api/assignments` | admin | Create assignment |
| `PUT` | `/api/assignments/:id` | admin | Update assignment |
| `DELETE` | `/api/assignments/:id` | admin | Delete assignment |
| `POST` | `/api/agent/chat` | student | AI chat with tool-call trace |
| `POST` | `/api/seed` | admin | Seed all collections from JSON files |

**Total: 31 endpoints**
