import { Router } from "express"
import { runAgent } from "../agent/executor.js"

const router = Router()

router.post("/chat", async (req, res, next) => {
  try {
    const { messages } = req.body
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array required" })
    }
    const result = await runAgent({ messages })
    res.json(result)
  } catch (err) { next(err) }
})

export default router
