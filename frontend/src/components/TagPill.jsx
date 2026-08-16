import React from "react";

const TagPill = ({ tag, onClick, active = false }) => (
  <button
    onClick={onClick}
    type="button"
    className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-colors duration-150 ${
      active
        ? "bg-amber/15 border-amber text-amber-light"
        : "bg-paperLight border-border text-muted hover:border-amber hover:text-amber-light"
    }`}
  >
    #{tag}
  </button>
);

export default TagPill;
