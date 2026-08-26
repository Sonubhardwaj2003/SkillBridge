import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import api from "../api/axios.js";
import Avatar from "../components/Avatar.jsx";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "Users" },
  { key: "reports", label: "Reports" },
];

const StatCard = ({ label, value, accent = "text-chalk" }) => (
  <div className="card p-5">
    <p className={`font-display font-bold text-3xl ${accent}`}>{value}</p>
    <p className="text-sm text-muted mt-1">{label}</p>
  </div>
);

const AdminDashboard = () => {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [reportedQuestions, setReportedQuestions] = useState([]);
  const [reportedAnswers, setReportedAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/stats");
      setStats(data.stats);
    } catch {
      toast.error("Failed to load stats");
    }
  }, []);

  const fetchUsers = useCallback(async (search = "") => {
    try {
      const { data } = await api.get("/admin/users", { params: { search: search || undefined } });
      setUsers(data.users);
    } catch {
      toast.error("Failed to load users");
    }
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/reports");
      setReportedQuestions(data.reportedQuestions);
      setReportedAnswers(data.reportedAnswers);
    } catch {
      toast.error("Failed to load reports");
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchUsers(), fetchReports()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchStats, fetchUsers, fetchReports]);

  const handleUserSearch = (e) => {
    e.preventDefault();
    fetchUsers(userSearch);
  };

  const handleToggleBan = async (userId, currentlyBanned) => {
    try {
      await api.put(`/admin/users/${userId}/ban`);
      toast.success(currentlyBanned ? "User unbanned" : "User banned");
      fetchUsers(userSearch);
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleDismissReport = async (type, id) => {
    try {
      await api.put(`/admin/${type}/${id}/dismiss-report`);
      toast.success("Report dismissed");
      fetchReports();
      fetchStats();
    } catch {
      toast.error("Failed to dismiss report");
    }
  };

  const handleDeleteReported = async (type, id) => {
    if (!window.confirm("Delete this content permanently?")) return;
    try {
      await api.delete(`/admin/${type}/${id}`);
      toast.success("Content deleted");
      fetchReports();
      fetchStats();
    } catch {
      toast.error("Failed to delete content");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display font-bold text-2xl mb-1">Admin Dashboard</h1>
      <p className="text-muted text-sm mb-6">Moderation and platform overview.</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? "border-amber text-amber-light" : "border-transparent text-muted hover:text-chalk"
            }`}
          >
            {t.label}
            {t.key === "reports" && stats?.pendingReports > 0 && (
              <span className="ml-1.5 text-[10px] bg-coral text-white rounded-full px-1.5 py-0.5">
                {stats.pendingReports}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Total Users" value={stats.totalUsers} />
          <StatCard label="Total Questions" value={stats.totalQuestions} />
          <StatCard label="Total Answers" value={stats.totalAnswers} />
          <StatCard label="Resolved Questions" value={stats.resolvedQuestions} accent="text-teal" />
          <StatCard label="Pending Reports" value={stats.pendingReports} accent="text-coral" />
          <StatCard label="Banned Users" value={stats.bannedUsers} accent="text-muted" />
        </div>
      )}

      {/* Users */}
      {tab === "users" && (
        <div>
          <form onSubmit={handleUserSearch} className="mb-4">
            <input
              className="input-field max-w-sm"
              placeholder="Search by name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </form>
          <div className="card divide-y divide-border">
            {users.length === 0 && <p className="text-muted text-sm p-4">No users found.</p>}
            {users.map((u) => (
              <div key={u._id} className="flex items-center gap-3 p-4">
                <Avatar name={u.name} avatarUrl={u.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${u._id}`} className="text-sm font-medium text-chalk hover:text-amber">
                    {u.name}
                  </Link>
                  <p className="text-xs text-muted truncate">{u.email}</p>
                </div>
                {u.role === "admin" ? (
                  <span className="text-xs font-mono px-2 py-1 rounded-md bg-amber/15 text-amber-light">Admin</span>
                ) : (
                  <button
                    onClick={() => handleToggleBan(u._id, u.isBanned)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                      u.isBanned
                        ? "border-teal text-teal hover:bg-teal/10"
                        : "border-coral text-coral hover:bg-coral/10"
                    }`}
                  >
                    {u.isBanned ? "Unban" : "Ban"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports */}
      {tab === "reports" && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display font-semibold text-base mb-3">
              Reported Questions ({reportedQuestions.length})
            </h2>
            <div className="space-y-3">
              {reportedQuestions.length === 0 && (
                <p className="text-muted text-sm">No reported questions. All clear.</p>
              )}
              {reportedQuestions.map((q) => (
                <div key={q._id} className="card p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Link to={`/questions/${q._id}`} className="text-sm font-medium text-chalk hover:text-amber">
                      {q.title}
                    </Link>
                    <span className="text-xs text-muted shrink-0">
                      {formatDistanceToNow(new Date(q.report.reportedAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted mb-1">
                    By {q.author?.name} · Reported by {q.report.reportedBy?.name || "a user"}
                  </p>
                  <p className="text-sm text-coral mb-3">Reason: {q.report.reason}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDismissReport("questions", q._id)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-muted hover:border-teal hover:text-teal transition-colors"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleDeleteReported("questions", q._id)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-coral text-coral hover:bg-coral/10 transition-colors"
                    >
                      Delete Question
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display font-semibold text-base mb-3">
              Reported Answers ({reportedAnswers.length})
            </h2>
            <div className="space-y-3">
              {reportedAnswers.length === 0 && (
                <p className="text-muted text-sm">No reported answers. All clear.</p>
              )}
              {reportedAnswers.map((a) => (
                <div key={a._id} className="card p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Link to={`/questions/${a.question?._id}`} className="text-sm font-medium text-chalk hover:text-amber">
                      On: {a.question?.title}
                    </Link>
                    <span className="text-xs text-muted shrink-0">
                      {formatDistanceToNow(new Date(a.report.reportedAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted mb-1">
                    By {a.author?.name} · Reported by {a.report.reportedBy?.name || "a user"}
                  </p>
                  <p className="text-sm text-chalk bg-paperLight rounded-lg p-3 mb-2 line-clamp-3">{a.content}</p>
                  <p className="text-sm text-coral mb-3">Reason: {a.report.reason}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDismissReport("answers", a._id)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-muted hover:border-teal hover:text-teal transition-colors"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleDeleteReported("answers", a._id)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-coral text-coral hover:bg-coral/10 transition-colors"
                    >
                      Delete Answer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
