import express from "express"
import cors from "cors"
import morgan from "morgan"
import dotenv from "dotenv"

import { connectDB } from "./db.js"
import { errorHandler } from "./middleware/error.js"

import schedules from "./routes/schedules.js"
import rooms from "./routes/rooms.js"
import events from "./routes/events.js"
import announcements from "./routes/announcements.js"
import assignments from "./routes/assignments.js"
import agent from "./routes/agent.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  credentials: true
}))
app.use(express.json())
app.use(morgan("dev"))

app.get("/health", (_, res) => res.json({ ok: true, service: "campusos-backend" }))

app.use("/api/schedules", schedules)
app.use("/api/rooms", rooms)
app.use("/api/events", events)
app.use("/api/announcements", announcements)
app.use("/api/assignments", assignments)
app.use("/api/agent", agent)

app.use(errorHandler)

async function main() {
  await connectDB()
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
