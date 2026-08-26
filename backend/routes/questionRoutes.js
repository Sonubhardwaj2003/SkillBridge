import express from "express";
import {
  createQuestion,
  getQuestions,
  getQuestionById,
  toggleUpvoteQuestion,
  deleteQuestion,
  updateQuestion,
  reportQuestion,
} from "../controllers/questionController.js";
import { createAnswer } from "../controllers/answerController.js";
import { getAISuggestion } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(getQuestions).post(protect, createQuestion);
router.route("/:id").get(getQuestionById).put(protect, updateQuestion).delete(protect, deleteQuestion);
router.put("/:id/upvote", protect, toggleUpvoteQuestion);
router.post("/:id/answers", protect, createAnswer);
router.post("/:id/ai-suggestion", protect, getAISuggestion);
router.post("/:id/report", protect, reportQuestion);

export default router;
