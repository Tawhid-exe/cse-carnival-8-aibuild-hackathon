import mongoose from "mongoose"

const BookingSchema = new mongoose.Schema(
  {
    booking_id: { type: String, required: true },
    booked_by: { type: String, required: true },
    user_id: { type: String, default: "" },   // Better Auth user.id — for ownership checks
    date: { type: String, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    purpose: { type: String, default: "" }
  },
  { _id: false }
)

const RoomSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    room_number: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["classroom", "lab", "seminar"]
    },
    capacity: { type: Number, required: true },
    equipment: { type: [String], default: [] },
    floor: { type: Number, required: true },
    status: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available"
    },
    bookings: { type: [BookingSchema], default: [] }
  },
  { timestamps: true }
)

export const Room = mongoose.model("Room", RoomSchema)
