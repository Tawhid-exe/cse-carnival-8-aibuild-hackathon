import { Router } from "express"
import { Event } from "../models/Event.js"
import { HttpError } from "../middleware/error.js"

const router = Router()

router.get("/", async (req, res, next) => {
  try {
    const filter = {}
    for (const k of ["date", "status", "id"]) {
      if (req.query[k]) filter[k] = req.query[k]
    }
    const data = await Event.find(filter).sort({ date: 1, start_time: 1 })
    res.json({ data, count: data.length })
  } catch (err) { next(err) }
})

router.get("/:id", async (req, res, next) => {
  try {
    const item = await Event.findOne({ id: req.params.id })
    if (!item) throw new HttpError(404, "Event not found")
    res.json({ data: item })
  } catch (err) { next(err) }
})

router.post("/", async (req, res, next) => {
  try {
    const created = await Event.create({ ...req.body, id: req.body.id || `evt-${Date.now()}` })
    res.status(201).json({ data: created })
  } catch (err) { next(err) }
})

router.put("/:id", async (req, res, next) => {
  try {
    const updated = await Event.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!updated) throw new HttpError(404, "Event not found")
    res.json({ data: updated })
  } catch (err) { next(err) }
})

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Event.findOneAndDelete({ id: req.params.id })
    if (!deleted) throw new HttpError(404, "Event not found")
    res.status(204).send()
  } catch (err) { next(err) }
})

router.post("/:id/register", async (req, res, next) => {
  try {
    const { student_id, name } = req.body
    if (!student_id || !name) throw new HttpError(400, "student_id and name required")

    const event = await Event.findOne({ id: req.params.id })
    if (!event) throw new HttpError(404, "Event not found")

    if (event.registrations.some((r) => r.student_id === student_id)) {
      throw new HttpError(409, "Already registered")
    }
    if (event.registered >= event.capacity) {
      throw new HttpError(409, "Event is full")
    }

    event.registrations.push({ student_id, name })
    event.registered += 1
    if (event.registered >= event.capacity) event.status = "full"
    await event.save()
    res.status(201).json({ data: event })
  } catch (err) { next(err) }
})

router.delete("/:id/register", async (req, res, next) => {
  try {
    const { student_id } = req.body
    if (!student_id) throw new HttpError(400, "student_id required")

    const event = await Event.findOne({ id: req.params.id })
    if (!event) throw new HttpError(404, "Event not found")

    const before = event.registrations.length
    event.registrations = event.registrations.filter((r) => r.student_id !== student_id)
    if (event.registrations.length === before) throw new HttpError(404, "Registration not found")

    event.registered = Math.max(event.registrations.length, event.registered - 1)
    if (event.status === "full" && event.registered < event.capacity) event.status = "upcoming"
    await event.save()
    res.json({ data: event })
  } catch (err) { next(err) }
})

export default router
