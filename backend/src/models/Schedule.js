import mongoose from "mongoose"

const ScheduleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    course: { type: String, required: true, index: true },
    title: { type: String, required: true },
    day: {
      type: String,
      required: true,
      enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
      index: true
    },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    room: { type: String, required: true },
    instructor: { type: String, default: "TBA" },
    section: { type: String, default: "" }
  },
  { timestamps: true }
)

export const Schedule = mongoose.model("Schedule", ScheduleSchema)
