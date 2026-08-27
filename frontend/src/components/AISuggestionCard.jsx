import React, { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios.js";

/**
 * Escalating AI help: the first two generations give a short nudge/hint.
 * From the third generation onward, the backend switches to a fully
 * explained answer with examples/code, since at that point the student
 * has already asked twice and just wants the real explanation.
 */
const AISuggestionCard = ({ questionId, initialSuggestion, initialGenerationCount = 0 }) => {
  const [suggestion, setSuggestion] = useState(initialSuggestion || "");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(!!initialSuggestion);
  const [generationCount, setGenerationCount] = useState(initialGenerationCount);

  const isFullAnswer = generationCount > 2;
  const nextIsFullAnswer = generationCount + 1 > 2;

  const fetchSuggestion = async (regenerate = false) => {
    setLoading(true);
    try {
      const { data } = await api.post(
        `/questions/${questionId}/ai-suggestion${regenerate ? "?regenerate=true" : ""}`
      );
      setSuggestion(data.suggestion);
      setVisible(true);
      if (!data.cached) {
        setGenerationCount((c) => c + 1);
      }
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        toast.error("The AI hint is taking too long and timed out. Please try again.");
      } else {
        toast.error(err.response?.data?.message || "Couldn't generate an AI hint right now");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!visible) {
    return (
      <button
        onClick={() => fetchSuggestion(false)}
        disabled={loading}
        className="w-full card p-4 flex items-center justify-center gap-2 text-sm font-medium text-amber-light border-dashed border-amber/40 hover:border-amber hover:bg-amber/5 transition-colors disabled:opacity-60"
      >
        <span>✨</span>
        {loading ? "Thinking..." : "Get an AI Hint before waiting for an answer"}
      </button>
    );
  }

  return (
    <div className="card p-5 border-amber/30 bg-amber/5 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-semibold uppercase tracking-wide text-amber-light flex items-center gap-1.5">
          <span>✨</span> {isFullAnswer ? "AI Full Explanation" : "AI Starter Hint"}
        </span>
        <button
          onClick={() => fetchSuggestion(true)}
          disabled={loading}
          className="text-xs text-muted hover:text-amber-light transition-colors disabled:opacity-50"
        >
          {loading ? "Generating..." : "Regenerate"}
        </button>
      </div>
      <p className="text-sm text-chalk leading-relaxed whitespace-pre-wrap">{suggestion}</p>
      {isFullAnswer ? (
        <p className="text-xs text-muted mt-3 italic">
          This is a full explanation since you've asked a couple of times already — human answers below
          can still add more context.
        </p>
      ) : (
        <p className="text-xs text-muted mt-3 italic">
          This is a nudge in the right direction, not a full solution — human answers below are still the
          real deal.
          {generationCount >= 1 && " Regenerate once more for a fully explained answer with examples."}
        </p>
      )}
    </div>
  );
};

export default AISuggestionCard;