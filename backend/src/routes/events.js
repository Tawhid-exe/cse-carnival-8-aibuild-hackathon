import { Router } from "express"
import * as eventController from "../controllers/eventController.js"
import { validate } from "../validators/validate.js"
import { validateEvent, validateRegistration } from "../validators/schemas.js"

const router = Router()

router.get("/", eventController.getEvents)
router.get("/:id", eventController.getEventById)
router.post("/", validate((b) => validateEvent(b, "POST")), eventController.postEvent)
router.put("/:id", validate((b) => validateEvent(b, "PUT")), eventController.putEvent)
router.delete("/:id", eventController.deleteEventById)

router.post("/:id/register", validate(validateRegistration), eventController.postRegisterEvent)
router.delete("/:id/register/:registrationId", eventController.deleteCancelRegistration)

export default router
