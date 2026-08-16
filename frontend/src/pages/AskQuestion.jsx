import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios.js";

const AskQuestion = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", codeSnippet: "", tagsInput: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tags = form.tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
      const { data } = await api.post("/questions", {
        title: form.title,
        description: form.description,
        codeSnippet: form.codeSnippet,
        tags,
      });
      toast.success("Doubt posted! Matching peers have been notified.");
      navigate(`/questions/${data.question._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post question");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display font-bold text-2xl mb-1">Ask a Doubt</h1>
      <p className="text-muted text-sm mb-6">
        Be specific — good titles and tags help the right peers find and answer your question fast.
      </p>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="text-sm text-muted mb-1.5 block">Title</label>
          <input
            required
            maxLength={200}
            className="input-field"
            placeholder="e.g. Why does my useEffect run twice in React 18?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm text-muted mb-1.5 block">Description</label>
          <textarea
            required
            rows={6}
            maxLength={5000}
            className="input-field resize-none"
            placeholder="Explain what you tried, what you expected, and what actually happened..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm text-muted mb-1.5 block">
            Code snippet <span className="text-muted">(optional)</span>
          </label>
          <textarea
            rows={5}
            className="input-field resize-none font-mono text-sm"
            placeholder="Paste relevant code here..."
            value={form.codeSnippet}
            onChange={(e) => setForm({ ...form, codeSnippet: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm text-muted mb-1.5 block">
            Tags <span className="text-muted">(comma separated)</span>
          </label>
          <input
            className="input-field"
            placeholder="react, hooks, javascript"
            value={form.tagsInput}
            onChange={(e) => setForm({ ...form, tagsInput: e.target.value })}
          />
          <p className="text-xs text-muted mt-1.5">
            Peers who listed these skills will get a live notification.
          </p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Posting..." : "Post Doubt"}
        </button>
      </form>
    </div>
  );
};

export default AskQuestion;
