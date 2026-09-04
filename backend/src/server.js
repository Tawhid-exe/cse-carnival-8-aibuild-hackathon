import express from "express"
import cors from "cors"
import morgan from "morgan"
import dotenv from "dotenv"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { connectDB } from "./db.js"
import { seedIfEmpty } from "./seed.js"
import { errorHandler } from "./middleware/error.js"
import { optionalAuth } from "./middleware/auth.js"

import schedules from "./routes/schedules.js"
import rooms from "./routes/rooms.js"
import events from "./routes/events.js"
import announcements from "./routes/announcements.js"
import assignments from "./routes/assignments.js"
import agent from "./routes/agent.js"
import seed from "./routes/seed.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, "../.env") })

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  credentials: true
}))
app.use(express.json())
app.use(morgan("dev"))
app.use(optionalAuth)

app.get("/health", (_, res) => res.json({ ok: true, service: "campusos-backend" }))

app.use("/api/schedules", schedules)
app.use("/api/rooms", rooms)
app.use("/api/events", events)
app.use("/api/announcements", announcements)
app.use("/api/assignments", assignments)
app.use("/api/agent", agent)
app.use("/api/seed", seed)

app.use(errorHandler)

async function main() {
  await connectDB()
  await seedIfEmpty()
  app.listen(PORT, () => {
    console.log(`\n CampusOS backend running on http://localhost:${PORT}`)
    console.log(`  Health: http://localhost:${PORT}/health\n`)
  })
}

main().catch((err) => {
  console.error("Failed to start backend:", err)
  process.exit(1)
})

export default app
