import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Question title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: 5000,
    },
    codeSnippet: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "answered", "resolved"],
      default: "open",
    },
    acceptedAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
      default: null,
    },
    views: {
      type: Number,
      default: 0,
    },
    upvotes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    // Cached LLM-generated starter hint. Generated on-demand (button click),
    // not automatically, to control API cost. Once generated, it's reused
    // instead of calling the AI API again on every page view.
    // generationCount tracks how many times "Generate"/"Regenerate" has been
    // clicked for this question — the first two are short nudges, the third
    // onward escalates to a fully explained answer with examples/code (see
    // aiController.js).
    aiSuggestion: {
      content: { type: String, default: "" },
      generatedAt: { type: Date, default: null },
      generationCount: { type: Number, default: 0 },
    },
    // Moderation: any logged-in user (other than the author) can flag a
    // question. Flagged content surfaces in the admin dashboard's report
    // queue for review.
    report: {
      reported: { type: Boolean, default: false },
      reason: { type: String, default: "" },
      reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      reportedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// Text index for search functionality
questionSchema.index({ title: "text", description: "text", tags: "text" });

const Question = mongoose.model("Question", questionSchema);
export default Question;
