import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import Avatar from "./Avatar.jsx";
import NotificationDropdown from "./NotificationDropdown.jsx";

// Shared active/inactive styling for desktop NavLinks
const desktopLinkClass = ({ isActive }) =>
  `text-sm transition-colors ${isActive ? "text-amber font-semibold" : "text-muted hover:text-chalk"}`;

// Shared active/inactive styling for mobile menu links (bigger tap targets)
const mobileLinkClass = ({ isActive }) =>
  `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
    isActive ? "bg-amber/15 text-amber-light" : "text-chalk hover:bg-paperLight"
  }`;

const Navbar = () => {
  const { user, isAuthenticated } = useAuth();
  const { unreadCount, clearUnread } = useSocket();
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-40 bg-ink/90 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-amber shadow-glow group-hover:animate-pulse-slow" />
          <span className="font-display font-bold text-lg text-chalk tracking-tight">
            Skill<span className="text-amber">Bridge</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-6 font-body">
          <NavLink to="/" end className={desktopLinkClass}>
            Browse Doubts
          </NavLink>
          <NavLink to="/leaderboard" className={desktopLinkClass}>
            Leaderboard
          </NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin" className={desktopLinkClass}>
              Admin
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
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

              <Link to={`/profile/${user._id}`} className="hidden sm:flex items-center gap-2">
                <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline text-sm text-muted hover:text-chalk transition-colors">
                Login
              </Link>
              <Link to="/register" className="btn-primary text-sm !px-4 !py-2">
                Sign Up
              </Link>
            </>
          )}

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen((s) => !s)}
            className="sm:hidden w-9 h-9 rounded-lg bg-paperLight border border-border flex items-center justify-center"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8E6DF" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8E6DF" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-border bg-ink px-4 py-3 space-y-1 animate-fade-in">
          <NavLink to="/" end className={mobileLinkClass} onClick={closeMobileMenu}>
            Browse Doubts
          </NavLink>
          <NavLink to="/leaderboard" className={mobileLinkClass} onClick={closeMobileMenu}>
            Leaderboard
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink to="/ask" className={mobileLinkClass} onClick={closeMobileMenu}>
                Ask a Doubt
              </NavLink>
              <NavLink to={`/profile/${user._id}`} className={mobileLinkClass} onClick={closeMobileMenu}>
                My Profile
              </NavLink>
              {user?.role === "admin" && (
                <NavLink to="/admin" className={mobileLinkClass} onClick={closeMobileMenu}>
                  Admin Dashboard
                </NavLink>
              )}
            </>
          ) : (
            <>
              <NavLink to="/login" className={mobileLinkClass} onClick={closeMobileMenu}>
                Login
              </NavLink>
              <NavLink to="/register" className={mobileLinkClass} onClick={closeMobileMenu}>
                Sign Up
              </NavLink>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
