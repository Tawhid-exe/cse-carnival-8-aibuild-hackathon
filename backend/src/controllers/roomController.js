import * as roomService from "../services/roomService.js"

export async function getRooms(req, res, next) {
  try {
    const data = await roomService.listRooms(req.query)
    res.json({ data, count: data.length })
  } catch (err) {
    next(err)
  }
}

export async function getRoomById(req, res, next) {
  try {
    const data = await roomService.getRoom(req.params.id)
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function postRoom(req, res, next) {
  try {
    const data = await roomService.createRoom(req.body)
    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function putRoom(req, res, next) {
  try {
    const data = await roomService.updateRoom(req.params.id, req.body)
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function deleteRoomById(req, res, next) {
  try {
    await roomService.deleteRoom(req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function postBookRoom(req, res, next) {
  try {
    const result = await roomService.bookRoom(req.params.id, req.body)
    res.status(201).json({ data: result.room, booking: result.booking })
  } catch (err) {
    next(err)
  }
}

export async function deleteCancelBooking(req, res, next) {
  try {
    const result = await roomService.cancelBooking(req.params.id, req.params.bookingId, req.user)
    res.json({ data: result.room, message: "Booking cancelled successfully" })
  } catch (err) {
    next(err)
  }
}
