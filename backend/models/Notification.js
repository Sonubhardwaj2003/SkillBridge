import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["new_matching_question", "new_answer", "upvote", "accepted_answer"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedQuestion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
