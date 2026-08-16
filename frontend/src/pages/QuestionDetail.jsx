import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import Avatar from "../components/Avatar.jsx";
import TagPill from "../components/TagPill.jsx";
import AISuggestionCard from "../components/AISuggestionCard.jsx";

const statusLabel = {
  open: { text: "Open", className: "text-coral" },
  answered: { text: "Answered", className: "text-amber" },
  resolved: { text: "Resolved", className: "text-teal" },
};

const AnswerCard = ({ answer, isQuestionAuthor, onUpvote, onAccept, currentUserId }) => {
  const hasUpvoted = answer.upvotes?.includes(currentUserId);
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
          <Avatar name={answer.author?.name || "?"} size="sm" />
          <span className="text-chalk font-medium">{answer.author?.name}</span>
          <span>· {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}</span>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>
    </div>
  );
};

const QuestionDetail = () => {
  const { id } = useParams();
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
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-mono font-semibold uppercase tracking-wide ${status.className}`}>
            {status.text}
          </span>
          <span className="text-xs text-muted">{question.views} views</span>
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
            <Avatar name={question.author?.name || "?"} size="sm" />
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
      </div>

      {/* AI Hint */}
      {isAuthenticated && (
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
