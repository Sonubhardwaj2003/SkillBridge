import asyncHandler from "express-async-handler";
import Question from "../models/Question.js";

const GEMINI_TIMEOUT_MS = 20000; // never let a single attempt hang forever

/**
 * Calls the Google Gemini API (free tier, no credit card needed).
 * Get a free key from https://aistudio.google.com/apikey
 *
 * - Retries on 503 (model temporarily overloaded) with a short backoff.
 * - Aborts and fails fast if Gemini doesn't respond within GEMINI_TIMEOUT_MS,
 *   instead of hanging indefinitely (this was the "waits 3-5 minutes and does
 *   nothing" bug — there was previously no timeout at all).
 * - Recognizes 429 (daily/per-minute free-tier quota used up) as a distinct,
 *   clearly-labeled error instead of a generic failure.
 */
const callGemini = async (prompt, attempt = 1) => {
  const MAX_ATTEMPTS = 3;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("AI_TIMEOUT");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 503 && attempt < MAX_ATTEMPTS) {
    const delayMs = attempt * 1500; // 1.5s, then 3s
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return callGemini(prompt, attempt + 1);
  }

  if (!response.ok) {
    if (response.status === 503) throw new Error("AI_OVERLOADED");
    if (response.status === 429) throw new Error("AI_QUOTA_EXCEEDED");
    const errBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text;
};

// Attempts 1-2: a short nudge, doesn't solve the problem outright.
const buildHintPrompt = (question) => `You are helping a student who is stuck on a coding/technical doubt on a peer-learning platform called SkillBridge. Give a short, encouraging starter hint (not a full solution) that points them in the right direction and helps them think it through. Keep it around 200-300 words. Do not solve the entire problem outright — guide them, ask a leading question if useful, but don't give the complete answer or full working code yet.

Question title: ${question.title}
Description: ${question.description}
${question.codeSnippet ? `Code snippet:\n${question.codeSnippet}` : ""}
Tags: ${question.tags.join(", ")}`;

// Attempt 3 onward: the student has already tried twice and asked again, so
// give them the real, complete answer instead of another nudge.
const buildFullAnswerPrompt = (question) => `You are helping a student on a peer-learning platform called SkillBridge. They've already been given a starter hint twice and are asking again, so at this point give them a full, clear, well-explained answer — not just a hint. Explain the concept properly, walk through the reasoning, and include a relevant code example or snippet if the question is code-related. Keep it well-structured (short paragraphs, and a code block if applicable) and aim for roughly 300-1000 words — thorough enough to actually resolve their doubt.

Question title: ${question.title}
Description: ${question.description}
${question.codeSnippet ? `Code snippet:\n${question.codeSnippet}` : ""}
Tags: ${question.tags.join(", ")}`;

// @desc    Generate (or return cached) AI starter-hint for a question
// @route   POST /api/questions/:id/ai-suggestion
// @access  Private (question author only)
export const getAISuggestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error("Question not found");
  }

  // Only the person who asked the question can request an AI hint for it —
  // other users are here to answer, not to get hints for someone else's doubt.
  if (question.author.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the question's author can request an AI hint for it");
  }

  // Serve cached suggestion unless the client explicitly asks to regenerate
  const forceRegenerate = req.query.regenerate === "true";
  if (question.aiSuggestion?.content && !forceRegenerate) {
    return res.json({
      success: true,
      suggestion: question.aiSuggestion.content,
      cached: true,
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(503);
    throw new Error("AI suggestions are not configured on this server (missing GEMINI_API_KEY)");
  }

  // 1st and 2nd generation -> short hint. 3rd generation onward -> full answer.
  const nextGenerationCount = (question.aiSuggestion?.generationCount || 0) + 1;
  const prompt =
    nextGenerationCount <= 2 ? buildHintPrompt(question) : buildFullAnswerPrompt(question);

  let suggestion;
  try {
    suggestion = await callGemini(prompt);
  } catch (err) {
    res.status(503);
    if (err.message === "AI_OVERLOADED") {
      throw new Error("The AI hint service is busy right now (free-tier demand spike). Please try again in a minute.");
    }
    if (err.message === "AI_QUOTA_EXCEEDED") {
      throw new Error("The free AI quota has been used up for now (Gemini's free tier has a daily/per-minute limit). Please try again later — usually resets within a day.");
    }
    if (err.message === "AI_TIMEOUT") {
      throw new Error("The AI service took too long to respond and timed out. Please try again.");
    }
    throw err;
  }

  question.aiSuggestion = {
    content: suggestion,
    generatedAt: new Date(),
    generationCount: nextGenerationCount,
  };
  await question.save();

  res.json({
    success: true,
    suggestion,
    cached: false,
    isFullAnswer: nextGenerationCount > 2,
  });
});