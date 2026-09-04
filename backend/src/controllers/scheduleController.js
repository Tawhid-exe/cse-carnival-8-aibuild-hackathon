import * as scheduleService from "../services/scheduleService.js"

export async function getSchedules(req, res, next) {
  try {
    const data = await scheduleService.listSchedules(req.query)
    res.json({ data, count: data.length })
  } catch (err) {
    next(err)
  }
}

export async function getScheduleById(req, res, next) {
  try {
    const data = await scheduleService.getSchedule(req.params.id)
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function postSchedule(req, res, next) {
  try {
    const data = await scheduleService.createSchedule(req.body)
    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function putSchedule(req, res, next) {
  try {
    const data = await scheduleService.updateSchedule(req.params.id, req.body)
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function deleteScheduleById(req, res, next) {
  try {
    await scheduleService.deleteSchedule(req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
