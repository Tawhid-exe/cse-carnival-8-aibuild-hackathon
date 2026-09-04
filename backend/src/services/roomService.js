import { Room } from "../models/Room.js"
import { HttpError } from "../middleware/error.js"

export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}

export async function listRooms(query = {}) {
  const filter = {}

  if (query.type) {
    filter.type = query.type
  }
  if (query.min_capacity) {
    filter.capacity = { $gte: Number(query.min_capacity) }
  }
  if (query.status) {
    filter.status = query.status
  }
  if (query.room_number) {
    filter.room_number = query.room_number
  }
  if (query.equipment) {
    const eqList = Array.isArray(query.equipment)
      ? query.equipment
      : query.equipment.split(",").map((s) => s.trim()).filter(Boolean)
    if (eqList.length > 0) {
      filter.equipment = { $all: eqList }
    }
  }

  let items = await Room.find(filter).sort({ room_number: 1 })

  // Availability check supports both naming conventions (date/start_time/end_time or available_date/available_start/available_end)
  const date = query.available_date || query.date
  const startTime = query.available_start || query.start_time
  const endTime = query.available_end || query.end_time

  if (date && startTime && endTime) {
    items = items.filter((room) => {
      if (room.status === "unavailable") return false
      return !room.bookings.some(
        (b) => b.date === date && overlaps(b.start_time, b.end_time, startTime, endTime)
      )
    })
  }

  return items
}

export async function getRoom(id) {
  const room = await Room.findOne({ id })
  if (!room) {
    throw new HttpError(404, `Room with id '${id}' not found`, "NOT_FOUND")
  }
  return room
}

export async function createRoom(data) {
  const existing = await Room.findOne({ room_number: data.room_number })
  if (existing) {
    throw new HttpError(409, `Room ${data.room_number} already exists`, "CONFLICT")
  }

  const id = data.id || `room-${Date.now()}`
  const created = await Room.create({
    ...data,
    id,
    equipment: Array.isArray(data.equipment) ? data.equipment : []
  })
  return created
}

export async function updateRoom(id, data) {
  if (data.room_number) {
    const existing = await Room.findOne({ room_number: data.room_number, id: { $ne: id } })
    if (existing) {
      throw new HttpError(409, `Room ${data.room_number} already exists`, "CONFLICT")
    }
  }

  const updated = await Room.findOneAndUpdate(
    { id },
    { $set: data },
    { new: true, runValidators: true }
  )
  if (!updated) {
    throw new HttpError(404, `Room with id '${id}' not found`, "NOT_FOUND")
  }
  return updated
}

export async function deleteRoom(id) {
  const deleted = await Room.findOneAndDelete({ id })
  if (!deleted) {
    throw new HttpError(404, `Room with id '${id}' not found`, "NOT_FOUND")
  }
  return deleted
}

export async function bookRoom(id, bookingData) {
  const { date, start_time, end_time, booked_by, user_id, purpose } = bookingData
  const room = await Room.findOne({ id })
  if (!room) {
    throw new HttpError(404, `Room with id '${id}' not found`, "NOT_FOUND")
  }

  if (room.status === "unavailable") {
    throw new HttpError(409, `Room ${room.room_number} is currently marked unavailable`, "CONFLICT")
  }

  const hasConflict = room.bookings.some(
    (b) => b.date === date && overlaps(b.start_time, b.end_time, start_time, end_time)
  )
  if (hasConflict) {
    throw new HttpError(
      409,
      `Room ${room.room_number} is already booked on ${date} between ${start_time} and ${end_time}`,
      "CONFLICT"
    )
  }

  const newBooking = {
    booking_id: `book-${Date.now()}`,
    booked_by,
    user_id: user_id || "",
    date,
    start_time,
    end_time,
    purpose: purpose || ""
  }

  room.bookings.push(newBooking)
  await room.save()

  return { room, booking: newBooking }
}

export async function cancelBooking(roomId, bookingId, user) {
  const room = await Room.findOne({ id: roomId })
  if (!room) {
    throw new HttpError(404, `Room with id '${roomId}' not found`, "NOT_FOUND")
  }

  const bookingIndex = room.bookings.findIndex((b) => b.booking_id === bookingId)
  if (bookingIndex === -1) {
    throw new HttpError(404, `Booking with id '${bookingId}' not found`, "NOT_FOUND")
  }

  const booking = room.bookings[bookingIndex]
  if (user && user.role !== "admin" && booking.user_id && booking.user_id !== user.id) {
    throw new HttpError(403, "You do not have permission to cancel this booking", "FORBIDDEN")
  }

  room.bookings.splice(bookingIndex, 1)
  await room.save()

  return { room, cancelledBookingId: bookingId }
}
