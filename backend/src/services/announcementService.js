import { Announcement } from "../models/Announcement.js"
import { HttpError } from "../middleware/error.js"

export async function listAnnouncements(query = {}) {
  const filter = {}

  if (query.priority) {
    filter.priority = query.priority
  }

  if (query.active === "true" || query.active === true) {
    const today = new Date().toISOString().split("T")[0]
    filter.$or = [{ expires: "" }, { expires: { $exists: false } }, { expires: { $gte: today } }]
  }

  let sortCriteria = { date: -1 }
  if (query.sort === "date_asc") {
    sortCriteria = { date: 1 }
  } else if (query.sort === "date_desc") {
    sortCriteria = { date: -1 }
  }

  let items = await Announcement.find(filter).sort(sortCriteria)

  if (query.sort === "priority_desc" || query.sort === "priority_asc") {
    const priorityWeight = { high: 3, medium: 2, low: 1 }
    items.sort((a, b) => {
      const diff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0)
      return query.sort === "priority_desc" ? diff : -diff
    })
  }

  return items
}

export async function getAnnouncement(id) {
  const item = await Announcement.findOne({ id })
  if (!item) {
    throw new HttpError(404, `Announcement with id '${id}' not found`, "NOT_FOUND")
  }
  return item
}

export async function createAnnouncement(data) {
  const id = data.id || `ann-${Date.now()}`
  const date = data.date || new Date().toISOString().split("T")[0]
  const created = await Announcement.create({
    ...data,
    id,
    date
  })
  return created
}

export async function updateAnnouncement(id, data) {
  const updated = await Announcement.findOneAndUpdate(
    { id },
    { $set: data },
    { new: true, runValidators: true }
  )
  if (!updated) {
    throw new HttpError(404, `Announcement with id '${id}' not found`, "NOT_FOUND")
  }
  return updated
}

export async function deleteAnnouncement(id) {
  const deleted = await Announcement.findOneAndDelete({ id })
  if (!deleted) {
    throw new HttpError(404, `Announcement with id '${id}' not found`, "NOT_FOUND")
  }
  return deleted
}
