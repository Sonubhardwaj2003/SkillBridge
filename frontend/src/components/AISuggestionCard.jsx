import React, { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios.js";

const AISuggestionCard = ({ questionId, initialSuggestion }) => {
  const [suggestion, setSuggestion] = useState(initialSuggestion || "");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(!!initialSuggestion);

  const fetchSuggestion = async (regenerate = false) => {
    setLoading(true);
    try {
      const { data } = await api.post(
        `/questions/${questionId}/ai-suggestion${regenerate ? "?regenerate=true" : ""}`
      );
      setSuggestion(data.suggestion);
      setVisible(true);
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
          <span>✨</span> AI Starter Hint
        </span>
        <button
          onClick={() => fetchSuggestion(true)}
          disabled={loading}
          className="text-xs text-muted hover:text-amber-light transition-colors disabled:opacity-50"
        >
          {loading ? "Regenerating..." : "Regenerate"}
        </button>
      </div>
      <p className="text-sm text-chalk leading-relaxed whitespace-pre-wrap">{suggestion}</p>
      <p className="text-xs text-muted mt-3 italic">
        This is a nudge in the right direction, not a full solution — human answers below are still the
        real deal.
      </p>
    </div>
  );
};

export default AISuggestionCard;
