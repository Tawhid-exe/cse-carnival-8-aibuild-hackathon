import mongoose from "mongoose"

const AnnouncementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    date: { type: String, required: true },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
      index: true
    },
    posted_by: { type: String, default: "" },
    expires: { type: String, default: "", index: true }
  },
  { timestamps: true }
)

export const Announcement = mongoose.model("Announcement", AnnouncementSchema)
