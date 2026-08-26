import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Answer content is required"],
      maxlength: 5000,
    },
    codeSnippet: {
      type: String,
      default: "",
    },
    upvotes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    isAccepted: {
      type: Boolean,
      default: false,
    },
    report: {
      reported: { type: Boolean, default: false },
      reason: { type: String, default: "" },
      reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      reportedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

const Answer = mongoose.model("Answer", answerSchema);
export default Answer;
