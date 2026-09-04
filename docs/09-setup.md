# 09 — Setup & Run

This file doubles as the **post-build README source** — copy the structure to the public `README.md` at ship time.

## Prerequisites

- **Node.js 20.x** — `node --version` should print `v20.x.x`. Get it from https://nodejs.org or use nvm.
- **npm** — comes with Node.
- **MongoDB Atlas account** — free M0 tier. Sign up at https://www.mongodb.com/atlas.
- **Groq API key** — free. Sign up at https://console.groq.com and create an API key.
- **Internet access** — to reach MongoDB Atlas and Groq.

No MongoDB install. No Docker. No other services.

## First-time setup (10 minutes)

### 1. Create MongoDB Atlas cluster

1. Go to https://www.mongodb.com/atlas and sign in.
2. Click **Build a Database** → choose **M0 FREE** → region closest to you → name it `campusos`.
3. **Database Access** (left sidebar) → Add New User:
   - Username: `campusos`
   - Password: generate a strong one, **save it**
   - Role: `Read and write to any database`
4. **Network Access** (left sidebar) → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`). (For dev only — judges will run from arbitrary IPs.)
5. **Database** → Connect → Drivers → copy the connection string. Looks like:
   ```
   mongodb+srv://campusos:<password>@campusos.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<password>` with the user password.

### 2. Get a Groq API key

1. Go to https://console.groq.com and sign in.
2. Click **API Keys** → **Create API Key** → name it `campusos` → copy the key.

### 3. Generate `BETTER_AUTH_SECRET`

A shared secret between frontend and backend for JWT signing:

```bash
openssl rand -hex 32
```

Copy the output. You'll paste the same value into both `.env` files.

## Project setup

### Clone

```bash
git clone https://github.com/Ahnaf181419/cse-carnival-8-aibuild-hackathon.git
cd cse-carnival-8-aibuild-hackathon
```

### Install

```bash
# root (for concurrently)
npm install

# backend
cd backend
npm install
cd ..

# frontend
cd frontend
npm install
cd ..
```

### Configure environment

**`backend/.env`:**
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```
MONGODB_URI=mongodb+srv://campusos:YOUR_PASSWORD@campusos.xxxxx.mongodb.net/campusos?retryWrites=true&w=majority
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
BETTER_AUTH_SECRET=<paste your 64-char hex here>
PORT=4000
FRONTEND_ORIGIN=http://localhost:3000
```

**`frontend/.env.local`:**
```bash
cp frontend/.env.local.example frontend/.env.local
```

Edit `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
BETTER_AUTH_SECRET=<paste SAME secret as backend>
BETTER_AUTH_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://campusos:YOUR_PASSWORD@campusos.xxxxx.mongodb.net/campusos?retryWrites=true&w=majority
```

> The `BETTER_AUTH_SECRET` **must be identical** in both files. Frontend uses it to sign JWTs; backend uses it to verify them.

### Run

From repo root:

```bash
npm run dev
```

This starts both processes via `concurrently`:
- Backend on `http://localhost:4000`
- Frontend on `http://localhost:3000`

Open `http://localhost:3000` in your browser.

## First login

On backend startup, a demo account is auto-created (if no users exist). Check the backend terminal for:

```
╔════════════════════════════════════════════════╗
║  Demo account created                          ║
║   email:      demo@campusos.test                ║
║   password:   campusos123                       ║
║   student_id: 20-40532                          ║
╚════════════════════════════════════════════════╝
```

Use these to log in, or click **Sign Up** to create your own.

## Verifying everything works

1. **Backend health check:**
   ```bash
   curl http://localhost:4000/health
   # → { "ok": true }
   ```

2. **Frontend loads:** browser opens to `/login`.

3. **Dashboard:** after login, home page shows counts (24 schedules, 20 rooms, etc.).

4. **CRUD:** go to `/schedule` → click "Add Schedule" → fill form → save → row appears → reload page → still there.

5. **Agent:** go to `/agent` → ask "What classes do I have on Sunday?" → assistant responds with schedule data, tool chip "list_schedules" visible.

6. **Live data test:** edit an announcement → switch to `/agent` → ask about it → new answer appears.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `MongooseServerSelectionError: connection timeout` | Atlas IP not whitelisted or wrong password | Network Access → add `0.0.0.0/0`; verify password in URI |
| `401 Invalid token` from backend | `BETTER_AUTH_SECRET` mismatch | Make both `.env` files have the identical value; restart both |
| `CORS error` in browser console | `FRONTEND_ORIGIN` doesn't match frontend URL | Update `backend/.env` `FRONTEND_ORIGIN=http://localhost:3000` exactly |
| `401 from Groq` | Bad API key | Verify `GROQ_API_KEY` in `backend/.env`; restart backend |
| `429 Rate limit` from Groq | Free tier limit | Wait a minute or switch to a different free-tier model |
| Agent returns empty answer | Tool call failed silently | Check backend console logs for executor errors |
| Frontend redirects to /login immediately | Session cookie not being sent | Make sure both apps are on `localhost` (not `127.0.0.1`) |
| `Cannot find module 'better-auth/...'` | Wrong BA version installed | Check `package.json` — BA moved to `@better-auth/*` scoped packages |
| Signup fails with "student_id required" | BA config missing `additionalFields` | Verify `lib/auth.ts` includes `additionalFields: { student_id: { ... } }` |

## Manual test checklist (matches scoring rubric)

- [ ] All 5 sections visible in dashboard
- [ ] Add works on all 5 sections, new record appears
- [ ] Edit works on all 5, updated values appear
- [ ] Delete works on all 5, record disappears
- [ ] Changes persist after reload
- [ ] Login + logout works
- [ ] Booking a room works; second booking in overlapping slot fails with 409
- [ ] Registering for an event works; registering twice fails
- [ ] Event capacity exceeded → 409
- [ ] Agent answers: "When is my next class?", "What's due this week?"
- [ ] Agent filters rooms: "Labs with projector, 30+ people"
- [ ] Agent books a room with full params
- [ ] Agent registers user for an event
- [ ] Agent asks back on vague requests (no booking action taken)
- [ ] Dashboard edit → agent immediately sees new data
- [ ] No API keys committed to repo (`.env` is gitignored)

## Production hardening (out of scope for hackathon)

Listed for completeness — **don't add these during the hackathon**:
- Rate limiting (express-rate-limit)
- Helmet for security headers
- Input sanitization
- HTTPS termination
- Logging aggregation
- Backup strategy for Atlas
- Role-based access control (admin vs student)
