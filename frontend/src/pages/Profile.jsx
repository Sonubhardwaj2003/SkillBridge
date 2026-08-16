import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";
import TagPill from "../components/TagPill.jsx";

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUserInPlace, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [form, setForm] = useState({ bio: "", college: "", branch: "", tagsInput: "" });

  const isOwnProfile = currentUser?._id === id;

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users/${id}`);
      setProfile(data.user);
      setQuestions(data.questions);
      setAnswers(data.answers);
      setForm({
        bio: data.user.bio || "",
        college: data.user.college || "",
        branch: data.user.branch || "",
        tagsInput: (data.user.tags || []).join(", "),
      });
    } catch {
      toast.error("Profile not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const tags = form.tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
      const { data } = await api.put("/users/me", { ...form, tags });
      setProfile(data.user);
      updateUserInPlace({ tags: data.user.tags, college: data.user.college, branch: data.user.branch });
      setEditing(false);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar name={profile.name} size="lg" />
          <div className="flex-1">
            <h1 className="font-display font-bold text-xl text-chalk">{profile.name}</h1>
            <p className="text-muted text-sm">
              {profile.branch && `${profile.branch} · `}
              {profile.college || "SkillBridge Member"}
            </p>
            <div className="flex gap-1.5 mt-2">
              {profile.badges?.map((b) => (
                <span
                  key={b}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal/10 text-teal border border-teal/30"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-2xl text-amber">{profile.reputation}</p>
            <p className="text-xs text-muted">Reputation</p>
          </div>
        </div>

        {!editing ? (
          <>
            {profile.bio && <p className="text-sm text-chalk mb-3">{profile.bio}</p>}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {profile.tags?.map((tag) => (
                <TagPill key={tag} tag={tag} />
              ))}
            </div>
            <div className="flex gap-6 text-sm text-muted">
              <span>
                <strong className="text-chalk">{profile.questionsAsked || 0}</strong> Questions
              </span>
              <span>
                <strong className="text-chalk">{profile.answersGiven || 0}</strong> Answers
              </span>
            </div>
            {isOwnProfile && (
              <button onClick={() => setEditing(true)} className="btn-secondary text-sm mt-4">
                Edit Profile
              </button>
            )}
          </>
        ) : (
          <form onSubmit={handleSave} className="space-y-3 mt-2">
            <textarea
              rows={3}
              className="input-field resize-none"
              placeholder="Short bio..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className="input-field"
                placeholder="College"
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
              />
              <input
                className="input-field"
                placeholder="Branch"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
              />
            </div>
            <input
              className="input-field"
              placeholder="Skills (comma separated)"
              value={form.tagsInput}
              onChange={(e) => setForm({ ...form, tagsInput: e.target.value })}
            />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary text-sm">
                Save Changes
              </button>
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary text-sm">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Recent questions */}
      <h2 className="font-display font-semibold text-lg mb-3">Recent Questions</h2>
      <div className="space-y-2 mb-6">
        {questions.length === 0 && <p className="text-muted text-sm">No questions asked yet.</p>}
        {questions.map((q) => (
          <Link key={q._id} to={`/questions/${q._id}`} className="card p-4 block hover:border-amber/50">
            <p className="text-sm text-chalk font-medium">{q.title}</p>
          </Link>
        ))}
      </div>

      {/* Recent answers */}
      <h2 className="font-display font-semibold text-lg mb-3">Recent Answers</h2>
      <div className="space-y-2">
        {answers.length === 0 && <p className="text-muted text-sm">No answers given yet.</p>}
        {answers.map((a) => (
          <Link
            key={a._id}
            to={`/questions/${a.question?._id}`}
            className="card p-4 block hover:border-amber/50"
          >
            <p className="text-xs text-muted mb-1">Answered:</p>
            <p className="text-sm text-chalk font-medium">{a.question?.title}</p>
          </Link>
        ))}
      </div>
      {/* Account settings - only visible to the profile owner */}
      {isOwnProfile && (
        <div className="card p-6 mt-6">
          <h2 className="font-display font-semibold text-base mb-1">Account</h2>
          <p className="text-muted text-sm mb-4">Signed in on this device.</p>

          {!confirmingLogout ? (
            <button
              onClick={() => setConfirmingLogout(true)}
              className="text-sm font-medium text-coral border border-coral/40 hover:bg-coral/10 transition-colors px-4 py-2 rounded-lg"
            >
              Log Out
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-chalk">Are you sure you want to log out?</p>
              <button
                onClick={handleLogout}
                className="text-sm font-medium bg-coral text-white px-4 py-1.5 rounded-lg hover:bg-coral/90 transition-colors"
              >
                Yes, Log Out
              </button>
              <button
                onClick={() => setConfirmingLogout(false)}
                className="text-sm text-muted hover:text-chalk transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
