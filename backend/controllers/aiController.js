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

  const prompt = `You are helping a student who is stuck on a coding/technical doubt on a peer-learning platform called SkillBridge. Initially give a short, encouraging starter hint (not a full solution) that points them in the right direction and helps them think it through. Keep it under 200 words. Do not solve the entire problem outright — guide them.But if the question is too vague or lacks context, ask clarifying questions instead of giving a hint. If the question is about a specific programming language, provide hints in that language. If the question includes a code snippet, analyze it and provide hints based on that code. If the question is about a concept or theory, provide hints that explain the concept clearly and concisely.But after 3-4 attemps , if the student is still stuck, you may provide a more detailed hint or a small code example to help them understand the solution. If the question is about debugging, ask for error messages and suggest common debugging techniques. If the question is about optimization, ask for performance metrics and suggest profiling tools. If the question is about best practices, ask for context and suggest relevant design patterns or principles. If the question is about a specific framework or library, ask for version information and suggest relevant documentation or examples. If the question is about a specific algorithm or data structure, ask for input size and complexity requirements and suggest relevant resources or implementations. If the question is about a specific API or service, ask for authentication details and suggest relevant endpoints or methods. If the question is about a specific platform or environment, ask for configuration details and suggest relevant settings or options.Provide full detailed answer after 3-4 attempts if the student is still stuck. Here is the question context:
  
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
