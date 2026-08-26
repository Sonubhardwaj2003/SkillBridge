import express from "express";
import {
  getDashboardStats,
  getAllUsers,
  toggleBanUser,
  getReportedContent,
  dismissQuestionReport,
  dismissAnswerReport,
} from "../controllers/adminController.js";
import { deleteQuestion } from "../controllers/questionController.js";
import { deleteAnswer } from "../controllers/answerController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Every route below requires a logged-in admin
router.use(protect, adminOnly);

router.get("/stats", getDashboardStats);
router.get("/users", getAllUsers);
router.put("/users/:id/ban", toggleBanUser);
router.get("/reports", getReportedContent);
router.put("/questions/:id/dismiss-report", dismissQuestionReport);
router.put("/answers/:id/dismiss-report", dismissAnswerReport);
// Reuse the existing delete controllers - they already allow admins through
router.delete("/questions/:id", deleteQuestion);
router.delete("/answers/:id", deleteAnswer);

export default router;
