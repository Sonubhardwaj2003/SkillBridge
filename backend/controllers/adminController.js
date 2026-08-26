import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Question from "../models/Question.js";
import Answer from "../models/Answer.js";

// @desc    Get overview stats for the admin dashboard
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalQuestions, totalAnswers, resolvedQuestions, reportedQuestions, reportedAnswers, bannedUsers] =
    await Promise.all([
      User.countDocuments(),
      Question.countDocuments(),
      Answer.countDocuments(),
      Question.countDocuments({ status: "resolved" }),
      Question.countDocuments({ "report.reported": true }),
      Answer.countDocuments({ "report.reported": true }),
      User.countDocuments({ isBanned: true }),
    ]);

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalQuestions,
      totalAnswers,
      resolvedQuestions,
      pendingReports: reportedQuestions + reportedAnswers,
      bannedUsers,
    },
  });
});

// @desc    List all users, with optional name/email search
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(query),
  ]);

  res.json({ success: true, users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// @desc    Ban or unban a user
// @route   PUT /api/admin/users/:id/ban
// @access  Private/Admin
export const toggleBanUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.role === "admin") {
    res.status(400);
    throw new Error("Admins can't be banned");
  }

  user.isBanned = !user.isBanned;
  await user.save();

  res.json({ success: true, isBanned: user.isBanned });
});

// @desc    Get all reported (flagged) questions and answers for review
// @route   GET /api/admin/reports
// @access  Private/Admin
export const getReportedContent = asyncHandler(async (req, res) => {
  const [reportedQuestions, reportedAnswers] = await Promise.all([
    Question.find({ "report.reported": true })
      .populate("author", "name email")
      .populate("report.reportedBy", "name")
      .sort({ "report.reportedAt": -1 }),
    Answer.find({ "report.reported": true })
      .populate("author", "name email")
      .populate("question", "title")
      .populate("report.reportedBy", "name")
      .sort({ "report.reportedAt": -1 }),
  ]);

  res.json({ success: true, reportedQuestions, reportedAnswers });
});

// @desc    Dismiss a report on a question (mark reviewed, keep content)
// @route   PUT /api/admin/questions/:id/dismiss-report
// @access  Private/Admin
export const dismissQuestionReport = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error("Question not found");
  }
  question.report = { reported: false, reason: "", reportedBy: null, reportedAt: null };
  await question.save();
  res.json({ success: true, message: "Report dismissed" });
});

// @desc    Dismiss a report on an answer (mark reviewed, keep content)
// @route   PUT /api/admin/answers/:id/dismiss-report
// @access  Private/Admin
export const dismissAnswerReport = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.id);
  if (!answer) {
    res.status(404);
    throw new Error("Answer not found");
  }
  answer.report = { reported: false, reason: "", reportedBy: null, reportedAt: null };
  await answer.save();
  res.json({ success: true, message: "Report dismissed" });
});
