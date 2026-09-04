import { Router } from "express"
import { Announcement } from "../models/Announcement.js"
import { HttpError } from "../middleware/error.js"

const router = Router()

router.get("/", async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.priority) filter.priority = req.query.priority
    const data = await Announcement.find(filter).sort({ date: -1 })
    res.json({ data, count: data.length })
  } catch (err) { next(err) }
})

router.get("/:id", async (req, res, next) => {
  try {
    const item = await Announcement.findOne({ id: req.params.id })
    if (!item) throw new HttpError(404, "Announcement not found")
    res.json({ data: item })
  } catch (err) { next(err) }
})

router.post("/", async (req, res, next) => {
  try {
    const created = await Announcement.create({ ...req.body, id: req.body.id || `ann-${Date.now()}` })
    res.status(201).json({ data: created })
  } catch (err) { next(err) }
})

router.put("/:id", async (req, res, next) => {
  try {
    const updated = await Announcement.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!updated) throw new HttpError(404, "Announcement not found")
    res.json({ data: updated })
  } catch (err) { next(err) }
})

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Announcement.findOneAndDelete({ id: req.params.id })
    if (!deleted) throw new HttpError(404, "Announcement not found")
    res.status(204).send()
  } catch (err) { next(err) }
})

export default router
