import mongoose from "mongoose"

const AssignmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    course: { type: String, required: true, index: true },
    course_title: { type: String, default: "" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    assigned_date: { type: String, required: true },
    deadline: { type: String, required: true, index: true },
    submission_platform: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "submitted", "graded", "late"],
      default: "pending",
      index: true
    },
    marks: { type: Number, default: 0 }
  },
  { timestamps: true }
)

export const Assignment = mongoose.model("Assignment", AssignmentSchema)
