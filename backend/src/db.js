import mongoose from "mongoose"

export async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error("MONGODB_URI is not set. Copy backend/.env.example to backend/.env and fill it in.")
    process.exit(1)
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000
    })
    console.log(" MongoDB connected:", mongoose.connection.name)
  } catch (err) {
    console.error(" MongoDB connection failed:", err.message)
    process.exit(1)
  }
}
