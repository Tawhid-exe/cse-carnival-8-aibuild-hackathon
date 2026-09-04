import { Router } from "express"
import { runAgent } from "../agent/executor.js"

const router = Router()

router.post("/chat", async (req, res, next) => {
  try {
    const { messages, student_id, name, user_id } = req.body
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array required", code: "VALIDATION_ERROR" })
    }
    const result = await runAgent({ messages, student_id, name, user_id })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
