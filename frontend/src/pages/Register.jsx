import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import PasswordInput from "../components/PasswordInput.jsx";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    college: "",
    branch: "",
    tagsInput: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tags = form.tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        college: form.college,
        branch: form.branch,
        tags,
      });
      toast.success("Account created! Welcome to SkillBridge.");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 bg-lamp-radial">
      <div className="card w-full max-w-md p-8 animate-fade-in">
        <h1 className="font-display font-bold text-2xl mb-1">Join SkillBridge</h1>
        <p className="text-muted text-sm mb-6">Ask doubts, help peers, build reputation.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted mb-1.5 block">Full Name</label>
            <input
              required
              className="input-field"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-muted mb-1.5 block">Email</label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="you@college.edu"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-muted mb-1.5 block">Password</label>
            <PasswordInput
              required
              minLength={6}
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted mb-1.5 block">College</label>
              <input
                className="input-field"
                placeholder="ABESEC"
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-muted mb-1.5 block">Branch</label>
              <input
                className="input-field"
                placeholder="CSE"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted mb-1.5 block">
              Skills / topics you can help with <span className="text-muted">(comma separated)</span>
            </label>
            <input
              className="input-field"
              placeholder="dsa, react, mongodb, java"
              value={form.tagsInput}
              onChange={(e) => setForm({ ...form, tagsInput: e.target.value })}
            />
            <p className="text-xs text-muted mt-1.5">
              We'll notify you in real time when someone posts a doubt matching these tags.
            </p>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-muted text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-amber hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
