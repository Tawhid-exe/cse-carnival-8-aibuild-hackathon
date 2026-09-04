import { Schedule } from "../models/Schedule.js"
import { HttpError } from "../middleware/error.js"

export async function listSchedules(query = {}) {
  const filter = {}

  if (query.day) {
    filter.day = query.day
  }
  if (query.course) {
    filter.course = { $regex: query.course, $options: "i" }
  }
  if (query.instructor) {
    filter.instructor = { $regex: query.instructor, $options: "i" }
  }
  if (query.room) {
    filter.room = query.room
  }
  if (query.section) {
    filter.section = query.section
  }

  const items = await Schedule.find(filter).sort({ day: 1, start_time: 1 })
  return items
}

export async function getSchedule(id) {
  const item = await Schedule.findOne({ id })
  if (!item) {
    throw new HttpError(404, `Schedule with id '${id}' not found`, "NOT_FOUND")
  }
  return item
}

export async function createSchedule(data) {
  const id = data.id || `sch-${Date.now()}`
  const created = await Schedule.create({ ...data, id })
  return created
}

export async function updateSchedule(id, data) {
  const updated = await Schedule.findOneAndUpdate(
    { id },
    { $set: data },
    { new: true, runValidators: true }
  )
  if (!updated) {
    throw new HttpError(404, `Schedule with id '${id}' not found`, "NOT_FOUND")
  }
  return updated
}

export async function deleteSchedule(id) {
  const deleted = await Schedule.findOneAndDelete({ id })
  if (!deleted) {
    throw new HttpError(404, `Schedule with id '${id}' not found`, "NOT_FOUND")
  }
  return deleted
}
