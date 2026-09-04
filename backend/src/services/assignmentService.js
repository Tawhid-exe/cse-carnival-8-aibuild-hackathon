import { Assignment } from "../models/Assignment.js"
import { HttpError } from "../middleware/error.js"

export async function listAssignments(query = {}) {
  const filter = {}

  if (query.course) {
    filter.course = { $regex: query.course, $options: "i" }
  }
  if (query.status) {
    filter.status = query.status
  }
  if (query.deadline_before) {
    filter.deadline = { $lte: query.deadline_before }
  }

  if (query.due_this_week === "true" || query.due_this_week === true) {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    const startStr = startOfWeek.toISOString().split("T")[0]
    const endStr = endOfWeek.toISOString().split("T")[0]

    filter.deadline = { ...(filter.deadline || {}), $gte: startStr, $lte: endStr }
  }

  let sortCriteria = { deadline: 1 }
  if (query.sort === "deadline_desc") {
    sortCriteria = { deadline: -1 }
  } else if (query.sort === "deadline_asc") {
    sortCriteria = { deadline: 1 }
  }

  const items = await Assignment.find(filter).sort(sortCriteria)
  return items
}

export async function getAssignment(id) {
  const item = await Assignment.findOne({ id })
  if (!item) {
    throw new HttpError(404, `Assignment with id '${id}' not found`, "NOT_FOUND")
  }
  return item
}

export async function createAssignment(data) {
  const id = data.id || `asg-${Date.now()}`
  const assigned_date = data.assigned_date || new Date().toISOString().split("T")[0]
  const created = await Assignment.create({
    ...data,
    id,
    assigned_date,
    status: data.status || "pending"
  })
  return created
}

export async function updateAssignment(id, data) {
  const updated = await Assignment.findOneAndUpdate(
    { id },
    { $set: data },
    { new: true, runValidators: true }
  )
  if (!updated) {
    throw new HttpError(404, `Assignment with id '${id}' not found`, "NOT_FOUND")
  }
  return updated
}

export async function deleteAssignment(id) {
  const deleted = await Assignment.findOneAndDelete({ id })
  if (!deleted) {
    throw new HttpError(404, `Assignment with id '${id}' not found`, "NOT_FOUND")
  }
  return deleted
}
