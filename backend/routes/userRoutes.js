import express from "express";
import {
  getUserProfile,
  updateProfile,
  getLeaderboard,
  getNotifications,
  markNotificationsRead,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// NOTE: specific routes must come before the dynamic "/:id" route
router.get("/leaderboard", getLeaderboard);
router.get("/notifications", protect, getNotifications);
router.put("/notifications/read", protect, markNotificationsRead);
router.put("/me", protect, updateProfile);
router.get("/:id", getUserProfile);

export default router;
