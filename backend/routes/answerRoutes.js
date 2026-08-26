import express from "express";
import { toggleUpvoteAnswer, acceptAnswer, deleteAnswer, reportAnswer } from "../controllers/answerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.put("/:id/upvote", protect, toggleUpvoteAnswer);
router.put("/:id/accept", protect, acceptAnswer);
router.delete("/:id", protect, deleteAnswer);
router.post("/:id/report", protect, reportAnswer);

export default router;
