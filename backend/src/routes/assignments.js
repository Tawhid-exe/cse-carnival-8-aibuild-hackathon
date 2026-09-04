import { Router } from "express"
import * as assignmentController from "../controllers/assignmentController.js"
import { validate } from "../validators/validate.js"
import { validateAssignment } from "../validators/schemas.js"

const router = Router()

router.get("/", assignmentController.getAssignments)
router.get("/:id", assignmentController.getAssignmentById)
router.post("/", validate((b) => validateAssignment(b, "POST")), assignmentController.postAssignment)
router.put("/:id", validate((b) => validateAssignment(b, "PUT")), assignmentController.putAssignment)
router.delete("/:id", assignmentController.deleteAssignmentById)

export default router
