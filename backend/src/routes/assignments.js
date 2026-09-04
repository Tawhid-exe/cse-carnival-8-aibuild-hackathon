import { Router } from "express"
import { Assignment } from "../models/Assignment.js"
import { HttpError } from "../middleware/error.js"

const router = Router()

router.get("/", async (req, res, next) => {
  try {
    const filter = {}
    for (const k of ["course", "status"]) {
      if (req.query[k]) filter[k] = req.query[k]
    }
    if (req.query.deadline_before) {
      filter.deadline = { $lt: req.query.deadline_before }
    }
    const data = await Assignment.find(filter).sort({ deadline: 1 })
    res.json({ data, count: data.length })
  } catch (err) { next(err) }
})

router.get("/:id", async (req, res, next) => {
  try {
    const item = await Assignment.findOne({ id: req.params.id })
    if (!item) throw new HttpError(404, "Assignment not found")
    res.json({ data: item })
  } catch (err) { next(err) }
})

router.post("/", async (req, res, next) => {
  try {
    const created = await Assignment.create({ ...req.body, id: req.body.id || `asgn-${Date.now()}` })
    res.status(201).json({ data: created })
  } catch (err) { next(err) }
})

router.put("/:id", async (req, res, next) => {
  try {
    const updated = await Assignment.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!updated) throw new HttpError(404, "Assignment not found")
    res.json({ data: updated })
  } catch (err) { next(err) }
})

router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Assignment.findOneAndDelete({ id: req.params.id })
    if (!deleted) throw new HttpError(404, "Assignment not found")
    res.status(204).send()
  } catch (err) { next(err) }
})

export default router
