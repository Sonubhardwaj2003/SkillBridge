import React from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import Avatar from "./Avatar.jsx";
import TagPill from "./TagPill.jsx";

const statusLabel = {
  open: { text: "Open", className: "text-coral" },
  answered: { text: "Answered", className: "text-amber" },
  resolved: { text: "Resolved", className: "text-teal" },
};

const QuestionCard = ({ question }) => {
  const status = statusLabel[question.status] || statusLabel.open;

  return (
    <Link
      to={`/questions/${question._id}`}
      className={`card status-${question.status} p-5 flex gap-4 hover:border-amber/50 transition-colors duration-200 animate-fade-in`}
    >
      {/* Stats column */}
      <div className="hidden sm:flex flex-col items-center justify-center w-16 shrink-0 text-center gap-1">
        <span className="font-display font-bold text-lg text-chalk">{question.upvotes?.length || 0}</span>
        <span className="text-[11px] text-muted uppercase tracking-wide">Upvotes</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className={`text-xs font-mono font-semibold uppercase tracking-wide ${status.className}`}>
            {status.text}
          </span>
          <span className="text-xs text-muted">{question.views || 0} views</span>
        </div>

        <h3 className="font-display font-semibold text-chalk text-base sm:text-lg mb-1.5 truncate">
          {question.title}
        </h3>

        <p className="text-sm text-muted line-clamp-2 mb-3">{question.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {question.tags?.slice(0, 4).map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted">
          <Avatar name={question.author?.name || "?"} avatarUrl={question.author?.avatarUrl} size="sm" />
          <span className="text-chalk font-medium">{question.author?.name}</span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}</span>
        </div>
      </div>
    </Link>
  );
};

export default QuestionCard;
