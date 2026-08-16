import React from "react";

// Deterministic color from a string, so each user gets a consistent avatar color
// when no photo has been uploaded yet.
const colors = ["#F2A93B", "#4FD1C5", "#F2685C", "#8B90A0", "#C6821F"];
const colorFromString = (str = "") => {
  const hash = str.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const sizeClasses = {
  sm: "w-7 h-7 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-xl",
};

const Avatar = ({ name = "?", size = "md", avatarUrl = "" }) => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover shrink-0 border border-border`}
      />
    );
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-display font-semibold text-ink shrink-0`}
      style={{ backgroundColor: colorFromString(name) }}
    >
      {initials || "?"}
    </div>
  );
};

export default Avatar;
