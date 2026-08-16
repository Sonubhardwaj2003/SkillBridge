import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Question from "../models/Question.js";
import Answer from "../models/Answer.js";
import Notification from "../models/Notification.js";

// @desc    Get public profile of a user + their activity
// @route   GET /api/users/:id
// @access  Public
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-email");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const [questions, answers] = await Promise.all([
    Question.find({ author: user._id }).sort({ createdAt: -1 }).limit(10),
    Answer.find({ author: user._id }).populate("question", "title").sort({ createdAt: -1 }).limit(10),
  ]);

  res.json({ success: true, user, questions, answers });
});

// @desc    Update own profile (bio, college, branch, tags)
// @route   PUT /api/users/me
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { bio, college, branch, tags } = req.body;
  const user = await User.findById(req.user._id);

  if (bio !== undefined) user.bio = bio;
  if (college !== undefined) user.college = college;
  if (branch !== undefined) user.branch = branch;
  if (tags !== undefined) user.tags = tags.map((t) => t.toLowerCase().trim()).filter(Boolean);

  await user.save();
  res.json({ success: true, user });
});

// @desc    Leaderboard - top contributors by reputation
// @route   GET /api/users/leaderboard
// @access  Public
export const getLeaderboard = asyncHandler(async (req, res) => {
  const topUsers = await User.find()
    .select("name reputation badges avatarSeed college answersGiven")
    .sort({ reputation: -1 })
    .limit(20);

  res.json({ success: true, leaderboard: topUsers });
});

// @desc    Get logged-in user's notifications
// @route   GET /api/users/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate("relatedQuestion", "title")
    .sort({ createdAt: -1 })
    .limit(30);

  res.json({ success: true, notifications });
});

// @desc    Mark all notifications as read
// @route   PUT /api/users/notifications/read
// @access  Private
export const markNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: "Notifications marked as read" });
});
