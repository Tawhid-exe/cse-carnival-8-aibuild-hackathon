import mongoose from "mongoose"

const RegistrationSchema = new mongoose.Schema(
  {
    registration_id: {
      type: String,
      default: () => `reg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    },
    student_id: { type: String, required: true },
    name: { type: String, required: true },
    user_id: { type: String, default: "" },             // Better Auth user.id
    registered_at: { type: Date, default: Date.now }
  },
  { _id: false }
)

const EventSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    date: { type: String, required: true, index: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    end_date: { type: String, default: "" },
    venue: { type: String, required: true },
    organizer: { type: String, default: "" },
    capacity: { type: Number, required: true },
    registered: { type: Number, default: 0 },
    registrations: { type: [RegistrationSchema], default: [] },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled", "full"],
      default: "upcoming"
    }
  },
  { timestamps: true }
)

export const Event = mongoose.model("Event", EventSchema)
