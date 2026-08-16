import asyncHandler from "express-async-handler";
import Question from "../models/Question.js";

/**
 * Calls the Google Gemini API (free tier, no credit card needed).
 * Get a free key from https://aistudio.google.com/apikey
 *
 * Retries on 503 (model temporarily overloaded) with a short exponential
 * backoff, since free-tier Gemini occasionally rejects requests during
 * high-demand spikes even though the key/quota is fine.
 */
const callGemini = async (prompt, attempt = 1) => {
  const MAX_ATTEMPTS = 3;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (response.status === 503 && attempt < MAX_ATTEMPTS) {
    const delayMs = attempt * 1500; // 1.5s, then 3s
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return callGemini(prompt, attempt + 1);
  }

  if (!response.ok) {
    const errBody = await response.text();
    const isOverloaded = response.status === 503;
    throw new Error(
      isOverloaded
        ? "AI_OVERLOADED" // recognizable marker, translated to a friendly message below
        : `Gemini API error (${response.status}): ${errBody}`
    );
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text;
};

// @desc    Generate (or return cached) AI starter-hint for a question
// @route   POST /api/questions/:id/ai-suggestion
// @access  Private
export const getAISuggestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error("Question not found");
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

  const prompt = `You are helping a student who is stuck on a coding/technical doubt on a peer-learning platform called SkillBridge. Give a short, encouraging starter hint (not a full solution) that points them in the right direction and helps them think it through. Keep it under 120 words. Do not solve the entire problem outright — guide them.

Question title: ${question.title}
Description: ${question.description}
${question.codeSnippet ? `Code snippet:\n${question.codeSnippet}` : ""}
Tags: ${question.tags.join(", ")}`;

  let suggestion;
  try {
    suggestion = await callGemini(prompt);
  } catch (err) {
    if (err.message === "AI_OVERLOADED") {
      res.status(503);
      throw new Error("The AI hint service is busy right now (free-tier demand spike). Please try again in a minute.");
    }
    throw err;
  }

  question.aiSuggestion = { content: suggestion, generatedAt: new Date() };
  await question.save();

  res.json({ success: true, suggestion, cached: false });
});
