import { Router } from "express"
import * as roomController from "../controllers/roomController.js"
import { validate } from "../validators/validate.js"
import { validateRoom, validateBooking } from "../validators/schemas.js"

const router = Router()

router.get("/", roomController.getRooms)
router.get("/:id", roomController.getRoomById)
router.post("/", validate((b) => validateRoom(b, "POST")), roomController.postRoom)
router.put("/:id", validate((b) => validateRoom(b, "PUT")), roomController.putRoom)
router.delete("/:id", roomController.deleteRoomById)

router.post("/:id/book", validate(validateBooking), roomController.postBookRoom)
router.delete("/:id/book/:bookingId", roomController.deleteCancelBooking)

export default router
