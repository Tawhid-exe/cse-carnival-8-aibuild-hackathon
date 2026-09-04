import * as announcementService from "../services/announcementService.js"

export async function getAnnouncements(req, res, next) {
  try {
    const data = await announcementService.listAnnouncements(req.query)
    res.json({ data, count: data.length })
  } catch (err) {
    next(err)
  }
}

export async function getAnnouncementById(req, res, next) {
  try {
    const data = await announcementService.getAnnouncement(req.params.id)
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function postAnnouncement(req, res, next) {
  try {
    const data = await announcementService.createAnnouncement(req.body)
    res.status(201).json({ data })
  } catch (err) {
    next(err)
  }
}

export async function putAnnouncement(req, res, next) {
  try {
    const data = await announcementService.updateAnnouncement(req.params.id, req.body)
    res.json({ data })
  } catch (err) {
    next(err)
  }
}

export async function deleteAnnouncementById(req, res, next) {
  try {
    await announcementService.deleteAnnouncement(req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
