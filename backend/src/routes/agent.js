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
    const status = err?.status || err?.response?.status
    if (status === 429 || status === 503 || /overloaded|rate.limit|resource.exhausted/i.test(err.message)) {
      return res.status(503).json({
        error: "The AI assistant is temporarily overloaded. Please try again in a few seconds.",
        code: "AI_OVERLOADED"
      })
    }
    next(err)
  }
})

export default router
