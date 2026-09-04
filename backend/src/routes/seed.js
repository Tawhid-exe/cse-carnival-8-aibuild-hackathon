import { Router } from "express"
import { seedIfEmpty, seedForce } from "../seed.js"

const router = Router()

router.post("/", async (req, res, next) => {
  try {
    const force = req.body?.force === true
    if (force) {
      const summary = await seedForce()
      res.json({ ok: true, message: "Database re-seeded successfully", summary })
    } else {
      await seedIfEmpty()
      res.json({ ok: true, message: "Database seed check completed" })
    }
  } catch (err) {
    next(err)
  }
})

export default router
