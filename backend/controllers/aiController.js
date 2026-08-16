import asyncHandler from "express-async-handler";
import Question from "../models/Question.js";

/**
 * Calls the Google Gemini API (free tier, no credit card needed).
 * Get a free key from https://aistudio.google.com/apikey
 */
const callGemini = async (prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errBody}`);
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

  const prompt = `You are helping a student who is stuck on a coding/technical doubt on a peer-learning platform called SkillBridge. Give a best possible, encouraging starter hint initially (not a full solution) that points them in the right direction and helps them think it through. Keep it under 5000 words. Do not solve the entire problem outright until they have made a genuine attempt — guide them.But if they have already made a genuine attempt, then provide a more detailed hint that nudges them towards the solution. If they are completely stuck, you can provide a more detailed solution. Be encouraging and supportive in your tone.

Question title: ${question.title}
Description: ${question.description}
${question.codeSnippet ? `Code snippet:\n${question.codeSnippet}` : ""}
Tags: ${question.tags.join(", ")}`;

  const suggestion = await callGemini(prompt);

  question.aiSuggestion = { content: suggestion, generatedAt: new Date() };
  await question.save();

  res.json({ success: true, suggestion, cached: false });
});
