import { Event } from "../models/Event.js"
import { HttpError } from "../middleware/error.js"

export async function listEvents(query = {}) {
  const filter = {}

  if (query.date) {
    filter.date = query.date
  }
  if (query.status) {
    filter.status = query.status
  }
  if (query.organizer) {
    filter.organizer = { $regex: query.organizer, $options: "i" }
  }
  if (query.venue) {
    filter.venue = { $regex: query.venue, $options: "i" }
  }

  const items = await Event.find(filter).sort({ date: 1, start_time: 1 })
  return items
}

export async function getEvent(id) {
  const event = await Event.findOne({ id })
  if (!event) {
    throw new HttpError(404, `Event with id '${id}' not found`, "NOT_FOUND")
  }
  return event
}

export async function createEvent(data) {
  const id = data.id || `event-${Date.now()}`
  const created = await Event.create({
    ...data,
    id,
    registered: data.registered || 0,
    registrations: data.registrations || []
  })
  return created
}

export async function updateEvent(id, data) {
  const updated = await Event.findOneAndUpdate(
    { id },
    { $set: data },
    { new: true, runValidators: true }
  )
  if (!updated) {
    throw new HttpError(404, `Event with id '${id}' not found`, "NOT_FOUND")
  }
  return updated
}

export async function deleteEvent(id) {
  const deleted = await Event.findOneAndDelete({ id })
  if (!deleted) {
    throw new HttpError(404, `Event with id '${id}' not found`, "NOT_FOUND")
  }
  return deleted
}

export async function registerForEvent(eventId, { student_id, name, user_id }) {
  const event = await Event.findOne({ id: eventId })
  if (!event) {
    throw new HttpError(404, `Event with id '${eventId}' not found`, "NOT_FOUND")
  }

  if (event.status === "cancelled" || event.status === "completed") {
    throw new HttpError(409, `Cannot register for a ${event.status} event`, "CONFLICT")
  }

  const alreadyRegistered = event.registrations.some((r) => r.student_id === student_id)
  if (alreadyRegistered) {
    throw new HttpError(
      409,
      `Student '${student_id}' is already registered for '${event.name}'`,
      "CONFLICT"
    )
  }

  if (event.registered >= event.capacity || event.status === "full") {
    throw new HttpError(422, `Event '${event.name}' has reached maximum capacity`, "CAPACITY_EXCEEDED")
  }

  const registration = {
    registration_id: `reg-${Date.now()}`,
    student_id,
    name,
    user_id: user_id || "",
    registered_at: new Date()
  }

  event.registrations.push(registration)
  event.registered = event.registrations.length
  if (event.registered >= event.capacity) {
    event.status = "full"
  }
  await event.save()

  return { event, registration }
}

export async function cancelRegistration(eventId, registrationId, user) {
  const event = await Event.findOne({ id: eventId })
  if (!event) {
    throw new HttpError(404, `Event with id '${eventId}' not found`, "NOT_FOUND")
  }

  const regIndex = event.registrations.findIndex(
    (r) => r.registration_id === registrationId || r.student_id === registrationId
  )
  if (regIndex === -1) {
    throw new HttpError(404, `Registration '${registrationId}' not found for this event`, "NOT_FOUND")
  }

  const reg = event.registrations[regIndex]
  if (user && user.role !== "admin" && reg.user_id && reg.user_id !== user.id) {
    throw new HttpError(403, "You do not have permission to cancel this registration", "FORBIDDEN")
  }

  event.registrations.splice(regIndex, 1)
  event.registered = event.registrations.length
  if (event.status === "full" && event.registered < event.capacity) {
    event.status = "upcoming"
  }
  await event.save()

  return { event, cancelledRegistrationId: reg.registration_id }
}
