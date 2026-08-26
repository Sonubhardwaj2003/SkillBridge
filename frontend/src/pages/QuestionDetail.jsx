import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import Avatar from "../components/Avatar.jsx";
import TagPill from "../components/TagPill.jsx";
import AISuggestionCard from "../components/AISuggestionCard.jsx";
import ReportButton from "../components/ReportButton.jsx";

const statusLabel = {
  open: { text: "Open", className: "text-coral" },
  answered: { text: "Answered", className: "text-amber" },
  resolved: { text: "Resolved", className: "text-teal" },
};

const AnswerCard = ({ answer, isQuestionAuthor, onUpvote, onAccept, currentUserId }) => {
  const hasUpvoted = answer.upvotes?.includes(currentUserId);
  const isOwnAnswer = answer.author?._id === currentUserId;
  return (
    <div className={`card p-5 ${answer.isAccepted ? "border-teal shadow-glow" : ""}`}>
      {answer.isAccepted && (
        <div className="flex items-center gap-1.5 text-teal text-xs font-semibold mb-3">
          <span>✓</span> Accepted Answer
        </div>
      )}
      <p className="text-chalk text-sm leading-relaxed whitespace-pre-wrap mb-3">{answer.content}</p>
      {answer.codeSnippet && (
        <pre className="bg-ink border border-border rounded-lg p-4 overflow-x-auto text-sm font-mono text-amber-light mb-3">
          <code>{answer.codeSnippet}</code>
        </pre>
      )}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Avatar name={answer.author?.name || "?"} avatarUrl={answer.author?.avatarUrl} size="sm" />
          <span className="text-chalk font-medium">{answer.author?.name}</span>
          <span>· {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onUpvote(answer._id)}
            className={`text-xs font-medium px-2.5 py-1 rounded-md border transition-colors ${
              hasUpvoted
                ? "bg-amber/15 border-amber text-amber-light"
                : "border-border text-muted hover:border-amber"
            }`}
          >
            ▲ {answer.upvotes?.length || 0}
          </button>
          {isQuestionAuthor && !answer.isAccepted && (
            <button
              onClick={() => onAccept(answer._id)}
              className="text-xs font-medium px-2.5 py-1 rounded-md border border-teal text-teal hover:bg-teal/10 transition-colors"
            >
              Accept
            </button>
          )}
          {!isOwnAnswer && <ReportButton endpoint={`/answers/${answer._id}/report`} />}
        </div>
      </div>
    </div>
  );
};

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState("");
  const [answerCode, setAnswerCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeout = useRef(null);

  // Edit / delete state (question author only)
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", codeSnippet: "", tagsInput: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/questions/${id}`);
      setQuestion(data.question);
      setAnswers(data.answers);
    } catch {
      toast.error("Question not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Join the question's live room for typing-presence
  useEffect(() => {
    if (!socket) return;
    socket.emit("joinQuestionRoom", id);

    const handleTyping = ({ userName }) => {
      setTypingUser(userName);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTypingUser(null), 2500);
    };
    socket.on("userTyping", handleTyping);

    return () => {
      socket.emit("leaveQuestionRoom", id);
      socket.off("userTyping", handleTyping);
    };
  }, [socket, id]);

  const handleAnswerChange = (e) => {
    setAnswerText(e.target.value);
    if (socket && user) {
      socket.emit("typingAnswer", { questionId: id, userName: user.name });
    }
  };

  const handleQuestionUpvote = async () => {
    if (!isAuthenticated) return toast.error("Log in to upvote");
    const { data } = await api.put(`/questions/${id}/upvote`);
    setQuestion((q) => ({
      ...q,
      upvotes: data.upvoted ? [...q.upvotes, user._id] : q.upvotes.filter((u) => u !== user._id),
    }));
  };

  const handleAnswerUpvote = async (answerId) => {
    if (!isAuthenticated) return toast.error("Log in to upvote");
    const { data } = await api.put(`/answers/${answerId}/upvote`);
    setAnswers((prev) =>
      prev.map((a) =>
        a._id === answerId
          ? {
              ...a,
              upvotes: data.upvoted ? [...a.upvotes, user._id] : a.upvotes.filter((u) => u !== user._id),
            }
          : a
      )
    );
  };

  const handleAccept = async (answerId) => {
    try {
      await api.put(`/answers/${answerId}/accept`);
      toast.success("Answer accepted!");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept answer");
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.error("Log in to answer");
    setSubmitting(true);
    try {
      await api.post(`/questions/${id}/answers`, { content: answerText, codeSnippet: answerCode });
      setAnswerText("");
      setAnswerCode("");
      toast.success("Answer posted!");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post answer");
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = () => {
    setEditForm({
      title: question.title,
      description: question.description,
      codeSnippet: question.codeSnippet || "",
      tagsInput: (question.tags || []).join(", "),
    });
    setEditing(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const tags = editForm.tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
      const { data } = await api.put(`/questions/${id}`, {
        title: editForm.title,
        description: editForm.description,
        codeSnippet: editForm.codeSnippet,
        tags,
      });
      setQuestion(data.question);
      setEditing(false);
      toast.success("Question updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update question");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/questions/${id}`);
      toast.success("Question deleted");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete question");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!question) return null;

  const status = statusLabel[question.status] || statusLabel.open;
  const isQuestionAuthor = user?._id === question.author?._id;
  const hasUpvoted = question.upvotes?.includes(user?._id);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/" className="text-sm text-muted hover:text-amber transition-colors mb-4 inline-block">
        ← Back to all doubts
      </Link>

      {/* Question */}
      <div className={`card status-${question.status} p-6 mb-6`}>
        {!editing ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-mono font-semibold uppercase tracking-wide ${status.className}`}>
                {status.text}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted">{question.views} views</span>
                {isQuestionAuthor ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={startEditing}
                      className="text-xs text-muted hover:text-amber-light transition-colors"
                    >
                      Edit
                    </button>
                    <span className="text-border">|</span>
                    <button
                      onClick={() => setConfirmingDelete(true)}
                      className="text-xs text-muted hover:text-coral transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  isAuthenticated && <ReportButton endpoint={`/questions/${id}/report`} />
                )}
              </div>
            </div>

            <h1 className="font-display font-bold text-xl sm:text-2xl text-chalk mb-3">{question.title}</h1>

            <p className="text-chalk text-sm leading-relaxed whitespace-pre-wrap mb-4">{question.description}</p>

            {question.codeSnippet && (
              <pre className="bg-ink border border-border rounded-lg p-4 overflow-x-auto text-sm font-mono text-amber-light mb-4">
                <code>{question.codeSnippet}</code>
              </pre>
            )}

            <div className="flex flex-wrap gap-1.5 mb-4">
              {question.tags?.map((tag) => (
                <TagPill key={tag} tag={tag} />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted">
                <Avatar name={question.author?.name || "?"} avatarUrl={question.author?.avatarUrl} size="sm" />
                <div>
                  <Link
                    to={`/profile/${question.author?._id}`}
                    className="text-chalk font-medium hover:text-amber"
                  >
                    {question.author?.name}
                  </Link>
                  <span> · {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
              <button
                onClick={handleQuestionUpvote}
                className={`text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
                  hasUpvoted ? "bg-amber/15 border-amber text-amber-light" : "border-border text-muted hover:border-amber"
                }`}
              >
                ▲ {question.upvotes?.length || 0} Upvotes
              </button>
            </div>

            {/* Delete confirmation */}
            {confirmingDelete && (
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                <p className="text-sm text-chalk">Delete this question? This can't be undone.</p>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-sm font-medium bg-coral text-white px-4 py-1.5 rounded-lg hover:bg-coral/90 transition-colors disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="text-sm text-muted hover:text-chalk transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        ) : (
          // Edit form
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="text-sm text-muted mb-1.5 block">Title</label>
              <input
                required
                maxLength={200}
                className="input-field"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-muted mb-1.5 block">Description</label>
              <textarea
                required
                rows={5}
                maxLength={5000}
                className="input-field resize-none"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-muted mb-1.5 block">Code snippet (optional)</label>
              <textarea
                rows={4}
                className="input-field resize-none font-mono text-sm"
                value={editForm.codeSnippet}
                onChange={(e) => setEditForm({ ...editForm, codeSnippet: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-muted mb-1.5 block">Tags (comma separated)</label>
              <input
                className="input-field"
                value={editForm.tagsInput}
                onChange={(e) => setEditForm({ ...editForm, tagsInput: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={savingEdit} className="btn-primary text-sm">
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* AI Hint - only visible to the question's own author.
          Other users are here to help answer, not to get hints for someone
          else's doubt. */}
      {isQuestionAuthor && !editing && (
        <div className="mb-6">
          <AISuggestionCard questionId={id} initialSuggestion={question.aiSuggestion?.content} />
        </div>
      )}

      {/* Answers */}
      <h2 className="font-display font-semibold text-lg mb-4">
        {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
      </h2>
      <div className="space-y-4 mb-8">
        {answers.map((a) => (
          <AnswerCard
            key={a._id}
            answer={a}
            isQuestionAuthor={isQuestionAuthor}
            onUpvote={handleAnswerUpvote}
            onAccept={handleAccept}
            currentUserId={user?._id}
          />
        ))}
        {answers.length === 0 && (
          <p className="text-muted text-sm">No answers yet. Be the first to help!</p>
        )}
      </div>

      {/* Answer form */}
      {isAuthenticated ? (
        <div className="card p-6">
          <h3 className="font-display font-semibold text-base mb-3">Your Answer</h3>
          {typingUser && typingUser !== user.name && (
            <p className="text-xs text-amber mb-2 animate-pulse-slow">{typingUser} is typing an answer...</p>
          )}
          <form onSubmit={handleSubmitAnswer} className="space-y-3">
            <textarea
              required
              rows={5}
              className="input-field resize-none"
              placeholder="Share your solution or explanation..."
              value={answerText}
              onChange={handleAnswerChange}
            />
            <textarea
              rows={3}
              className="input-field resize-none font-mono text-sm"
              placeholder="Code snippet (optional)"
              value={answerCode}
              onChange={(e) => setAnswerCode(e.target.value)}
            />
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Posting..." : "Post Answer"}
            </button>
          </form>
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-muted text-sm mb-3">Log in to post an answer.</p>
          <Link to="/login" className="btn-primary inline-block">
            Log In
          </Link>
        </div>
      )}
    </div>
  );
};

export default QuestionDetail;
