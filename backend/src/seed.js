import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { Schedule } from "./models/Schedule.js"
import { Room } from "./models/Room.js"
import { Event } from "./models/Event.js"
import { Announcement } from "./models/Announcement.js"
import { Assignment } from "./models/Assignment.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, "../../data")

async function readJson(file) {
  const raw = await fs.readFile(path.join(DATA_DIR, file), "utf8")
  return JSON.parse(raw)
}

async function seedCollection(Model, file) {
  const count = await Model.estimatedDocumentCount()
  if (count > 0) {
    console.log(`[seed] ${Model.modelName}: ${count} docs already present, skipping`)
    return count
  }
  const data = await readJson(file)
  await Model.insertMany(data, { ordered: false })
  console.log(`[seed] ${Model.modelName}: inserted ${data.length} docs`)
  return data.length
}

export async function seedIfEmpty() {
  await seedCollection(Schedule, "schedules.json")
  await seedCollection(Room, "rooms.json")
  await seedCollection(Event, "events.json")
  await seedCollection(Announcement, "announcements.json")
  await seedCollection(Assignment, "assignments.json")
}

export async function seedForce() {
  const models = [
    { Model: Schedule, file: "schedules.json" },
    { Model: Room, file: "rooms.json" },
    { Model: Event, file: "events.json" },
    { Model: Announcement, file: "announcements.json" },
    { Model: Assignment, file: "assignments.json" }
  ]

  const summary = {}

  for (const { Model, file } of models) {
    await Model.deleteMany({})
    const data = await readJson(file)
    await Model.insertMany(data, { ordered: false })
    summary[Model.modelName] = data.length
    console.log(`[seed:force] ${Model.modelName}: re-seeded with ${data.length} docs`)
  }

  return summary
}
