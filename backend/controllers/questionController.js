import asyncHandler from "express-async-handler";
import Question from "../models/Question.js";
import Answer from "../models/Answer.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// @desc    Create a new question + auto-match with peers who share tags
// @route   POST /api/questions
// @access  Private
export const createQuestion = asyncHandler(async (req, res) => {
  const { title, description, codeSnippet, tags } = req.body;

  if (!title || !description) {
    res.status(400);
    throw new Error("Title and description are required");
  }

  const normalizedTags = (tags || []).map((t) => t.toLowerCase().trim()).filter(Boolean);

  const question = await Question.create({
    title,
    description,
    codeSnippet: codeSnippet || "",
    tags: normalizedTags,
    author: req.user._id,
  });

  await User.findByIdAndUpdate(req.user._id, { $inc: { questionsAsked: 1 } });

  const populatedQuestion = await Question.findById(question._id).populate(
    "author",
    "name reputation badges avatarSeed"
  );

  // --- Real-time doubt-matching ---
  // Find peers whose skill tags overlap with the question tags, notify them live.
  if (normalizedTags.length > 0) {
    const matchedPeers = await User.find({
      tags: { $in: normalizedTags },
      _id: { $ne: req.user._id },
    }).select("_id name");

    const io = req.app.get("io");

    if (matchedPeers.length > 0) {
      const notifications = matchedPeers.map((peer) => ({
        recipient: peer._id,
        type: "new_matching_question",
        message: `New doubt posted in ${normalizedTags.join(", ")}: "${title}"`,
        relatedQuestion: question._id,
      }));
      const createdNotifications = await Notification.insertMany(notifications);

      // Emit live socket event to each matched peer's room
      createdNotifications.forEach((notif) => {
        io.to(notif.recipient.toString()).emit("newNotification", notif);
      });
    }
  }

  res.status(201).json({ success: true, question: populatedQuestion });
});

// @desc    Get all questions (with search, tag filter, sort, pagination)
// @route   GET /api/questions
// @access  Public
export const getQuestions = asyncHandler(async (req, res) => {
  const { search, tag, status, sort, page = 1, limit = 10 } = req.query;

  const query = {};
  if (search) {
    query.$text = { $search: search };
  }
  if (tag) {
    query.tags = tag.toLowerCase();
  }
  if (status) {
    query.status = status;
  }

  let sortOption = { createdAt: -1 }; // default: newest
  if (sort === "mostUpvoted") sortOption = { "upvotes.length": -1, createdAt: -1 };
  if (sort === "unanswered") query.status = "open";

  const skip = (Number(page) - 1) * Number(limit);

  const [questions, total] = await Promise.all([
    Question.find(query)
      .populate("author", "name reputation badges avatarSeed")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit)),
    Question.countDocuments(query),
  ]);

  res.json({
    success: true,
    questions,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

// @desc    Get single question with its answers
// @route   GET /api/questions/:id
// @access  Public
export const getQuestionById = asyncHandler(async (req, res) => {
  const question = await Question.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  ).populate("author", "name reputation badges avatarSeed college branch");

  if (!question) {
    res.status(404);
    throw new Error("Question not found");
  }

  const answers = await Answer.find({ question: question._id })
    .populate("author", "name reputation badges avatarSeed")
    .sort({ isAccepted: -1, createdAt: 1 });

  res.json({ success: true, question, answers });
});

// @desc    Upvote / remove upvote on a question
// @route   PUT /api/questions/:id/upvote
// @access  Private
export const toggleUpvoteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error("Question not found");
  }

  const alreadyUpvoted = question.upvotes.some((id) => id.toString() === req.user._id.toString());

  if (alreadyUpvoted) {
    question.upvotes = question.upvotes.filter((id) => id.toString() !== req.user._id.toString());
  } else {
    question.upvotes.push(req.user._id);
  }
  await question.save();

  res.json({ success: true, upvotes: question.upvotes.length, upvoted: !alreadyUpvoted });
});

// @desc    Delete a question (author or admin only)
// @route   DELETE /api/questions/:id
// @access  Private
export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error("Question not found");
  }

  if (question.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to delete this question");
  }

  await Answer.deleteMany({ question: question._id });
  await question.deleteOne();

  res.json({ success: true, message: "Question deleted" });
});
