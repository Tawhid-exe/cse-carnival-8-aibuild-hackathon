import { Router } from "express"
import * as scheduleController from "../controllers/scheduleController.js"
import { validate } from "../validators/validate.js"
import { validateSchedule } from "../validators/schemas.js"

const router = Router()

router.get("/", scheduleController.getSchedules)
router.get("/:id", scheduleController.getScheduleById)
router.post("/", validate((b) => validateSchedule(b, "POST")), scheduleController.postSchedule)
router.put("/:id", validate((b) => validateSchedule(b, "PUT")), scheduleController.putSchedule)
router.delete("/:id", scheduleController.deleteScheduleById)

export default router
