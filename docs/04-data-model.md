# 04 — Data Model

All five collections mirror the upstream `schema/schema.md`. MongoDB is document-based, so nested `bookings[]` and `registrations[]` live inside their parent documents — no joins.

## Conventions

- `_id` (Mongo native) used internally; the upstream `id` field (e.g. `"sch-001"`) is the stable application-level ID and is the primary key for the REST API.
- All IDs are strings.
- Times: 24h `HH:MM`.
- Dates: ISO `YYYY-MM-DD`.
- All timestamps (`createdAt`, `updatedAt`) come from Mongoose's `{ timestamps: true }` option.

## 1. Schedule

```ts
{
  id:          string   // "sch-001"
  course:      string   // "CSE 4113"
  title:       string   // full course title
  day:         enum     // "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday"
  start_time:  string   // "HH:MM"
  end_time:    string   // "HH:MM"
  room:        string   // "7A03"
  instructor:  string   // name or "TBA"
  section:     string   // "B", "B1/B2", "DWM"
  createdAt:   Date
  updatedAt:   Date
}
```

**Indexes:** `{ day: 1 }`, `{ course: 1 }`

## 2. Room

```ts
{
  id:           string   // "room-001"
  room_number:  string   // "7A03"
  type:         enum     // "classroom" | "lab" | "seminar"
  capacity:     number
  equipment:    string[] // ["projector", "AC", "whiteboard"]
  floor:        number
  status:       enum     // "available" | "unavailable"
  bookings:     Booking[]
  createdAt:    Date
  updatedAt:    Date
}

Booking {
  booking_id:  string   // "bk-001"
  booked_by:   string   // user name from session
  booked_by_id: string  // Better Auth user id (for ownership checks)
  date:        string   // "YYYY-MM-DD"
  start_time:  string   // "HH:MM"
  end_time:    string   // "HH:MM"
  purpose:     string
}
```

**Indexes:** `{ room_number: 1 }` (unique), `{ "bookings.date": 1 }`

**Conflict rule for `POST /api/rooms/:id/book`:**
Two bookings overlap if their `[start_time, end_time)` intervals intersect on the same date. Reject with `409 Conflict` if overlap found.

## 3. Event

```ts
{
  id:            string   // "evt-001"
  name:          string
  description:   string
  date:          string   // "YYYY-MM-DD" (start)
  start_time:    string   // "HH:MM"
  end_time:      string   // "HH:MM"
  end_date:      string   // for multi-day events
  venue:         string   // room number
  organizer:     string
  capacity:      number
  registered:    number   // denormalized count, equals registrations.length
  registrations: Registration[]
  status:        enum     // "upcoming" | "ongoing" | "completed" | "cancelled" | "full"
  createdAt:     Date
  updatedAt:     Date
}

Registration {
  student_id: string   // "20-40532"
  name:       string
  registered_at: Date
}
```

**Capacity rule for `POST /api/events/:id/register`:**
If `registrations.length >= capacity`, reject with `409 Conflict` (`event is full`).
On success, increment `registered` to match `registrations.length`.

**Status auto-update (optional, time permitting):**
A scheduled task or per-request check could flip `status` based on `date`/`start_time`/`end_time`. For MVP, status is set manually or left as `"upcoming"`.

## 4. Announcement

```ts
{
  id:         string   // "ann-001"
  title:      string
  body:       string
  date:       string   // posted date "YYYY-MM-DD"
  priority:   enum     // "high" | "medium" | "low"
  posted_by:  string   // user name from session (auto-filled)
  expires:    string   // "YYYY-MM-DD" — stale after this
  createdAt:  Date
  updatedAt:  Date
}
```

**Indexes:** `{ priority: 1 }`, `{ expires: 1 }`

## 5. Assignment

```ts
{
  id:                   string   // "asgn-001"
  course:               string   // "CSE 4113"
  course_title:         string
  title:                string
  description:          string
  assigned_date:        string   // "YYYY-MM-DD"
  deadline:             string   // "YYYY-MM-DD"
  submission_platform:  string   // "Google Classroom" | "Physical submission"
  status:               enum     // "pending" | "submitted" | "graded" | "late"
  marks:                number
  createdAt:            Date
  updatedAt:            Date
}
```

**Indexes:** `{ course: 1 }`, `{ deadline: 1 }`, `{ status: 1 }`

## 6. Better Auth collections (managed by BA)

Better Auth creates and manages its own collections when initialized with the MongoDB adapter:

```ts
user {
  _id: ObjectId
  id: string                  // BA id
  email: string               // unique
  emailVerified: boolean
  name: string
  student_id: string          // custom additional field
  image: string | null
  createdAt: Date
  updatedAt: Date
}

session {
  _id: ObjectId
  id: string                  // session id
  userId: string              // → user.id
  token: string               // unique
  expiresAt: Date
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  updatedAt: Date
}

account {                      // for credential storage / OAuth
  _id: ObjectId
  id: string
  userId: string
  providerId: string
  accountId: string
  password: string            // hashed, for email/password
  ...
}

verification {                 // for email verification tokens
  _id: ObjectId
  id: string
  identifier: string
  value: string
  expiresAt: Date
  ...
}
```

Don't write to these directly — let Better Auth manage them.

## Seed behavior

On backend startup:
1. Connect to MongoDB.
2. For each of the 5 app collections, if `count == 0`, read the corresponding `data/*.json` and `insertMany`.
3. Idempotent — safe to restart.

User collection is NOT seeded from JSON. On startup, if `users.count == 0`, create the demo account (see `06-auth.md`).

## Validation strategy

- **Light** at the Mongoose layer (required fields, enums, types).
- **Heavy** in the route handlers — the place where we want clear error messages.

Example room booking validation in route:
```js
if (!room_number || !date || !start_time || !end_time) {
  return res.status(400).json({ error: "Missing required fields" })
}
if (new Date(`${date}T${end_time}`) <= new Date(`${date}T${start_time}`)) {
  return res.status(400).json({ error: "end_time must be after start_time" })
}
```

We do **not** add a heavy validation library (Zod, Joi) — plain checks are faster to write and the schema is small.
