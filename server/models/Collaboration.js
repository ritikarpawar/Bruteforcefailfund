import mongoose from "mongoose"

const collaborationSchema = new mongoose.Schema({
  startup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Startup",
    required: true,
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  message: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Collaboration", collaborationSchema)
