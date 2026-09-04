import { Router } from "express"
import { Schedule } from "../models/Schedule.js"
import { HttpError } from "../middleware/error.js"

const router = Router()

router.get("/", async (req, res, next) => {
  try {
    const filter = {}
    for (const k of ["day", "course", "instructor", "room", "section"]) {
      if (req.query[k]) filter[k] = req.query[k]
    }
    const data = await Schedule.find(filter).sort({ day: 1, start_time: 1 })
    res.json({ data, count: data.length })
  } catch (err) { next(err) }
})

router.get("/:id", async (req, res, next) => {
  try {
    const item = await Schedule.findOne({ id: req.params.id })
    if (!item) throw new HttpError(404, "Schedule not found")
    res.json({ data: item })
  } catch (err) { next(err) }
})

router.post("/", async (req, res, next) => {
  try {
    const created = await Schedule.create({ ...req.body, id: req.body.id || `sch-${Date.now()}` })
    res.status(201).json({ data: created })
  } catch (err) { next(err) }
})

router.put("/:id", async (req, res, next) => {
  try {
    const updated = await Schedule.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!updated) throw new HttpError(404, "Schedule not found")
    res.json({ data: updated })
  } catch (err) { next(err) }
})

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Schedule.findOneAndDelete({ id: req.params.id })
    if (!deleted) throw new HttpError(404, "Schedule not found")
    res.status(204).send()
  } catch (err) { next(err) }
})

export default router
