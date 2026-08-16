import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import Avatar from "./Avatar.jsx";
import NotificationDropdown from "./NotificationDropdown.jsx";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount, clearUnread } = useSocket();
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-40 bg-ink/90 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="w-2.5 h-2.5 rounded-full bg-amber shadow-glow group-hover:animate-pulse-slow" />
          <span className="font-display font-bold text-lg text-chalk tracking-tight">
            Skill<span className="text-amber">Bridge</span>
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-6 font-body text-sm">
          <Link to="/" className="text-muted hover:text-chalk transition-colors">
            Browse Doubts
          </Link>
          <Link to="/leaderboard" className="text-muted hover:text-chalk transition-colors">
            Leaderboard
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link to="/ask" className="btn-primary text-sm !px-4 !py-2 hidden sm:inline-block">
                Ask a Doubt
              </Link>

              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifs((s) => !s);
                    if (!showNotifs) clearUnread();
                  }}
                  className="relative w-9 h-9 rounded-full bg-paperLight border border-border flex items-center justify-center hover:border-amber transition-colors"
                  aria-label="Notifications"
                >
                  <span className="text-base">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-coral rounded-full text-[10px] flex items-center justify-center font-semibold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifs && <NotificationDropdown onClose={() => setShowNotifs(false)} />}
              </div>

              <Link to={`/profile/${user._id}`} className="flex items-center gap-2">
                <Avatar name={user.name} size="sm" />
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-muted hover:text-coral transition-colors hidden sm:inline"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-muted hover:text-chalk transition-colors">
                Login
              </Link>
              <Link to="/register" className="btn-primary text-sm !px-4 !py-2">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
