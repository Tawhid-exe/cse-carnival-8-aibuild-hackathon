import { Router } from "express"
import { Room } from "../models/Room.js"
import { HttpError } from "../middleware/error.js"

const router = Router()

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}

router.get("/", async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.type) filter.type = req.query.type
    if (req.query.min_capacity) filter.capacity = { $gte: Number(req.query.min_capacity) }
    if (req.query.equipment) filter.equipment = req.query.equipment
    if (req.query.room_number) filter.room_number = req.query.room_number

    let data = await Room.find(filter)

    if (req.query.available_date && req.query.available_start && req.query.available_end) {
      const d = req.query.available_date
      const s = req.query.available_start
      const e = req.query.available_end
      data = data.filter((room) =>
        !room.bookings.some(
          (b) => b.date === d && overlaps(b.start_time, b.end_time, s, e)
        )
      )
    }

    res.json({ data, count: data.length })
  } catch (err) { next(err) }
})

router.get("/:id", async (req, res, next) => {
  try {
    const item = await Room.findOne({ id: req.params.id })
    if (!item) throw new HttpError(404, "Room not found")
    res.json({ data: item })
  } catch (err) { next(err) }
})

router.post("/", async (req, res, next) => {
  try {
    const created = await Room.create({ ...req.body, id: req.body.id || `room-${Date.now()}` })
    res.status(201).json({ data: created })
  } catch (err) { next(err) }
})

router.put("/:id", async (req, res, next) => {
  try {
    const updated = await Room.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!updated) throw new HttpError(404, "Room not found")
    res.json({ data: updated })
  } catch (err) { next(err) }
})

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Room.findOneAndDelete({ id: req.params.id })
    if (!deleted) throw new HttpError(404, "Room not found")
    res.status(204).send()
  } catch (err) { next(err) }
})

router.post("/:id/book", async (req, res, next) => {
  try {
    const { date, start_time, end_time, purpose, booked_by } = req.body
    if (!date || !start_time || !end_time || !booked_by) {
      throw new HttpError(400, "date, start_time, end_time, booked_by required")
    }
    if (end_time <= start_time) throw new HttpError(400, "end_time must be after start_time")

    const room = await Room.findOne({ id: req.params.id })
    if (!room) throw new HttpError(404, "Room not found")

    const conflict = room.bookings.some(
      (b) => b.date === date && overlaps(b.start_time, b.end_time, start_time, end_time)
    )
    if (conflict) throw new HttpError(409, "Room already booked for that time slot")

    room.bookings.push({
      booking_id: `bk-${Date.now()}`,
      booked_by,
      date, start_time, end_time,
      purpose: purpose || ""
    })
    await room.save()
    res.status(201).json({ data: room })
  } catch (err) { next(err) }
})

router.delete("/:id/book/:bookingId", async (req, res, next) => {
  try {
    const room = await Room.findOne({ id: req.params.id })
    if (!room) throw new HttpError(404, "Room not found")
    const before = room.bookings.length
    room.bookings = room.bookings.filter((b) => b.booking_id !== req.params.bookingId)
    if (room.bookings.length === before) throw new HttpError(404, "Booking not found")
    await room.save()
    res.json({ data: room })
  } catch (err) { next(err) }
})

export default router
