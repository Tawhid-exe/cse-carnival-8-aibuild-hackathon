# 06 — Auth (Better Auth)

## Why Better Auth

- TS-first, modern, designed for Next.js
- MongoDB adapter — uses the same Atlas cluster
- JWT plugin → easy bridge to Express middleware
- Self-hosted — no Clerk/Auth0 vendor
- Email/password out of the box

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (Next.js)                                              │
│                                                                 │
│  app/api/auth/[...all]/route.ts   ← BA catch-all                │
│  lib/auth.ts                      ← BA server config + Mongo    │
│  lib/auth-client.ts               ← BA client SDK               │
│  middleware.ts                    ← protects routes             │
└────────────────────┬────────────────────────────────────────────┘
                     │ signs JWT with BETTER_AUTH_SECRET
                     │
                     │ Authorization: Bearer <jwt>
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend (Express)                                               │
│                                                                 │
│  middleware/auth.js               ← verifies JWT w/ same secret│
│  app.use("/api", requireAuth)     ← gates every API route       │
│  req.user = { id, email, name, student_id }                     │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend setup

### `lib/auth.ts` (server config)

```ts
import { betterAuth } from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { jwt } from "better-auth/plugins"
import { MongoClient } from "mongodb"

const client = new MongoClient(process.env.MONGODB_URI!)
const db = client.db()

export const auth = betterAuth({
  database: mongodbAdapter(db),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      student_id: { type: "string", required: true }
    }
  },
  plugins: [jwt({ secret: process.env.BETTER_AUTH_SECRET! })],
  trustedOrigins: [process.env.BETTER_AUTH_URL!]
})
```

### `app/api/auth/[...all]/route.ts`

```ts
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"
export const { GET, POST } = toNextJsHandler(auth)
```

### `lib/auth-client.ts`

```ts
import { createAuthClient } from "better-auth/react"
import { jwtClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  plugins: [jwtClient()]
})

export const { signIn, signUp, signOut, useSession, getToken } = authClient
```

### `middleware.ts` (route protection)

```ts
import { auth } from "@/lib/auth"
import { NextRequest } from "next/server"

export default auth((req) => {
  const isAuth = !!req.auth
  const path = req.nextUrl.pathname
  const isAuthPage = path.startsWith("/login") || path.startsWith("/signup")
  const isPublicApi = path.startsWith("/api/auth")
  const isPublic = isAuthPage || isPublicApi

  if (!isAuth && !isPublic) {
    return Response.redirect(new URL("/login", req.nextUrl))
  }
})

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"]
}
```

## Backend setup

### `middleware/auth.js`

```js
import jwt from "jsonwebtoken"

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Auth required" })
  }
  try {
    const payload = jwt.verify(
      header.slice(7),
      process.env.BETTER_AUTH_SECRET
    )
    req.user = payload  // { id, email, name, student_id, ... }
    next()
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" })
  }
}
```

### `server.js`

```js
import express from "express"
import cors from "cors"
import { requireAuth } from "./middleware/auth.js"
import schedules from "./routes/schedules.js"
// ...

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,  // "http://localhost:3000"
  credentials: true
}))
app.use(express.json())

// Public — BA catch-all lives in Next.js
app.get("/health", (_, res) => res.json({ ok: true }))

// All API routes require auth
app.use("/api", requireAuth)
app.use("/api/schedules", schedules)
// ...

export default app
```

## Frontend API client with Bearer header

`lib/api.ts` includes a small wrapper that reads the JWT from the BA client and attaches it:

```ts
import { getToken } from "./auth-client"

async function authedFetch(url: string, options: RequestInit = {}) {
  const token = await getToken()
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})))
  return res.json()
}
```

## Demo account (judge convenience)

**All routes are gated** — judges must log in before seeing anything. To avoid a signup wall during judging, the backend auto-creates a demo account on first startup if no users exist.

`backend/src/seed.js` (excerpt):

```js
import bcrypt from "bcryptjs"
import { db } from "./db.js"

export async function ensureDemoUser() {
  const users = db.collection("user")
  const count = await users.countDocuments()
  if (count > 0) return

  const passwordHash = await bcrypt.hash("campusos123", 10)
  await users.insertOne({
    id: "demo-user",
    email: "demo@campusos.test",
    emailVerified: true,
    name: "Demo Student",
    student_id: "20-40532",
    image: null,
    createdAt: new Date(),
    updatedAt: new Date()
  })
  // Better Auth's account collection for password storage
  await db.collection("account").insertOne({
    id: "demo-account",
    userId: "demo-user",
    providerId: "credential",
    accountId: "demo@campusos.test",
    password: passwordHash,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  console.log(`
╔════════════════════════════════════════════════╗
║  Demo account created                          ║
║   email:      demo@campusos.test                ║
║   password:   campusos123                       ║
║   student_id: 20-40532                          ║
║  (Sign up your own at /signup)                  ║
╚════════════════════════════════════════════════╝`)
}
```

> Note: BA's internal password hashing format may differ from raw bcrypt. If BA rejects the seeded password, fall back to printing a "Run `npm run create-demo-user` after startup" message and create the user via BA's sign-up endpoint on first run instead.

## Identity auto-fill in routes

**Room booking (`POST /api/rooms/:id/book`):**
```js
const { date, start_time, end_time, purpose } = req.body
// ... validation ...
const booking = {
  booking_id: `bk-${Date.now()}`,
  booked_by: req.user.name,
  booked_by_id: req.user.id,
  date, start_time, end_time, purpose
}
await Room.findByIdAndUpdate(req.params.id, { $push: { bookings: booking } })
```

**Event registration (`POST /api/events/:id/register`):**
```js
const event = await Event.findById(req.params.id)
if (event.registrations.some(r => r.student_id === req.user.student_id)) {
  return res.status(409).json({ error: "Already registered" })
}
if (event.registrations.length >= event.capacity) {
  return res.status(409).json({ error: "Event is full" })
}
event.registrations.push({
  student_id: req.user.student_id,
  name: req.user.name,
  registered_at: new Date()
})
event.registered = event.registrations.length
await event.save()
```

## Ownership checks (cancel actions)

```js
// DELETE /api/rooms/:id/book/:bookingId
const room = await Room.findById(req.params.id)
const booking = room.bookings.id(req.params.bookingId)
if (!booking) return res.status(404).json({ error: "Booking not found" })
if (booking.booked_by_id !== req.user.id) {
  return res.status(403).json({ error: "Not allowed" })
}
booking.deleteOne()
await room.save()
```

## Env vars summary

**Frontend (`frontend/.env.local`):**
```
NEXT_PUBLIC_API_URL=http://localhost:4000
BETTER_AUTH_SECRET=<hex-32>
BETTER_AUTH_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://...    ← BA needs DB access
```

**Backend (`backend/.env`):**
```
MONGODB_URI=mongodb+srv://...
GROQ_API_KEY=<groq-key>
BETTER_AUTH_SECRET=<same-hex-32-as-frontend>
PORT=4000
FRONTEND_ORIGIN=http://localhost:3000
```

`BETTER_AUTH_SECRET` must be identical in both. Generate with `openssl rand -hex 32`.

## CORS

`backend/server.js`:
```js
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true
}))
```

If you see CORS errors in browser console, double-check `FRONTEND_ORIGIN` matches the exact URL the frontend runs on (including port).

## What this gets us

- ✅ All 10 "right actions" marks — identity flows cleanly through book/register
- ✅ 20 UI/UX marks — clean login/signup pages with shadcn
- ✅ Production-shape stack — judges recognize Better Auth
- ✅ Single source of truth — both UI and agent see same authenticated state

## Risks

| Risk | Mitigation |
|---|---|
| BA version churn (it's new) | Pin versions in `package.json` |
| `BETTER_AUTH_SECRET` mismatch between frontend/backend | README warns loudly; example shows identical placeholder |
| BA + Next.js middleware quirk | Use BA's `auth()` wrapper as shown above |
| Demo account password hashing format | If raw bcrypt fails, switch to creating via BA's sign-up API on startup |
