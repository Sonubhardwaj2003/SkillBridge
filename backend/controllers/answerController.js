import asyncHandler from "express-async-handler";
import Answer from "../models/Answer.js";
import Question from "../models/Question.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// @desc    Post an answer to a question
// @route   POST /api/questions/:id/answers
// @access  Private
export const createAnswer = asyncHandler(async (req, res) => {
  const { content, codeSnippet } = req.body;
  const question = await Question.findById(req.params.id);

  if (!question) {
    res.status(404);
    throw new Error("Question not found");
  }
  if (!content) {
    res.status(400);
    throw new Error("Answer content is required");
  }

  const answer = await Answer.create({
    question: question._id,
    author: req.user._id,
    content,
    codeSnippet: codeSnippet || "",
  });

  // Mark question as answered if it was open
  if (question.status === "open") {
    question.status = "answered";
    await question.save();
  }

  await User.findByIdAndUpdate(req.user._id, { $inc: { answersGiven: 1 } });

  // Notify the question author in real time
  if (question.author.toString() !== req.user._id.toString()) {
    const notification = await Notification.create({
      recipient: question.author,
      type: "new_answer",
      message: `${req.user.name} answered your question: "${question.title}"`,
      relatedQuestion: question._id,
    });
    const io = req.app.get("io");
    io.to(question.author.toString()).emit("newNotification", notification);
  }

  const populatedAnswer = await Answer.findById(answer._id).populate(
    "author",
    "name reputation badges avatarSeed"
  );

  res.status(201).json({ success: true, answer: populatedAnswer });
});

// @desc    Upvote / remove upvote on an answer (+2 reputation to author)
// @route   PUT /api/answers/:id/upvote
// @access  Private
export const toggleUpvoteAnswer = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.id);
  if (!answer) {
    res.status(404);
    throw new Error("Answer not found");
  }

  const alreadyUpvoted = answer.upvotes.some((id) => id.toString() === req.user._id.toString());
  const REP_PER_UPVOTE = 2;

  if (alreadyUpvoted) {
    answer.upvotes = answer.upvotes.filter((id) => id.toString() !== req.user._id.toString());
    await User.findByIdAndUpdate(answer.author, { $inc: { reputation: -REP_PER_UPVOTE } });
  } else {
    answer.upvotes.push(req.user._id);
    await User.findByIdAndUpdate(answer.author, { $inc: { reputation: REP_PER_UPVOTE } });
  }
  await answer.save();

  const author = await User.findById(answer.author);
  author.refreshBadges();
  await author.save();

  res.json({ success: true, upvotes: answer.upvotes.length, upvoted: !alreadyUpvoted });
});

// @desc    Accept an answer as the solution (+15 reputation, marks question resolved)
// @route   PUT /api/answers/:id/accept
// @access  Private (question author only)
export const acceptAnswer = asyncHandler(async (req, res) => {
  const REP_FOR_ACCEPTED = 15;
  const answer = await Answer.findById(req.params.id);
  if (!answer) {
    res.status(404);
    throw new Error("Answer not found");
  }

  const question = await Question.findById(answer.question);
  if (question.author.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the question author can accept an answer");
  }

  // Un-accept any previously accepted answer for this question
  await Answer.updateMany({ question: question._id }, { isAccepted: false });

  answer.isAccepted = true;
  await answer.save();

  question.status = "resolved";
  question.acceptedAnswer = answer._id;
  await question.save();

  const author = await User.findByIdAndUpdate(
    answer.author,
    { $inc: { reputation: REP_FOR_ACCEPTED } },
    { new: true }
  );
  author.refreshBadges();
  await author.save();

  const notification = await Notification.create({
    recipient: answer.author,
    type: "accepted_answer",
    message: `Your answer was accepted for: "${question.title}" (+${REP_FOR_ACCEPTED} reputation)`,
    relatedQuestion: question._id,
  });
  const io = req.app.get("io");
  io.to(answer.author.toString()).emit("newNotification", notification);

  res.json({ success: true, message: "Answer marked as accepted" });
});

// @desc    Delete an answer (author or admin only)
// @route   DELETE /api/answers/:id
// @access  Private
export const deleteAnswer = asyncHandler(async (req, res) => {
  const answer = await Answer.findById(req.params.id);
  if (!answer) {
    res.status(404);
    throw new Error("Answer not found");
  }
  if (answer.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to delete this answer");
  }
  await answer.deleteOne();
  res.json({ success: true, message: "Answer deleted" });
});
