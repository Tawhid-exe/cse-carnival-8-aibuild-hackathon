import { Router } from "express"
import * as announcementController from "../controllers/announcementController.js"
import { validate } from "../validators/validate.js"
import { validateAnnouncement } from "../validators/schemas.js"

const router = Router()

router.get("/", announcementController.getAnnouncements)
router.get("/:id", announcementController.getAnnouncementById)
router.post("/", validate((b) => validateAnnouncement(b, "POST")), announcementController.postAnnouncement)
router.put("/:id", validate((b) => validateAnnouncement(b, "PUT")), announcementController.putAnnouncement)
router.delete("/:id", announcementController.deleteAnnouncementById)

export default router
