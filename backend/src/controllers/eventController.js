import * as eventService from "../services/eventService.js"

export async function getEvents(req, res, next) {
  try {
    const data = await eventService.listEvents(req.query)
    res.json({ data, count: data.length })
  } catch (err) {
    next(err)
  }
}

export async function getEventById(req, res, next) {
  try {
    const data = await eventService.getEvent(req.params.id)
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function postEvent(req, res, next) {
  try {
    const data = await eventService.createEvent(req.body)
    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function putEvent(req, res, next) {
  try {
    const data = await eventService.updateEvent(req.params.id, req.body)
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function deleteEventById(req, res, next) {
  try {
    await eventService.deleteEvent(req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

export async function postRegisterEvent(req, res, next) {
  try {
    const result = await eventService.registerForEvent(req.params.id, req.body)
    res.status(201).json({ data: result.event, registration: result.registration })
  } catch (err) {
    next(err)
  }
}

export async function deleteCancelRegistration(req, res, next) {
  try {
    const result = await eventService.cancelRegistration(
      req.params.id,
      req.params.registrationId,
      req.user
    )
    res.json({ data: result.event, message: "Registration cancelled successfully" })
  } catch (err) {
    next(err)
  }
}
