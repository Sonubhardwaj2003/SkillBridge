import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import QuestionCard from "../components/QuestionCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const FILTERS = [
  { key: "", label: "Newest" },
  { key: "unanswered", label: "Unanswered" },
  { key: "mostUpvoted", label: "Most Upvoted" },
];

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/questions", {
        params: { search: search || undefined, sort: sort || undefined, page, limit: 8 },
      });
      setQuestions(data.questions);
      setPages(data.pages);
    } catch {
      // non-critical: keep prior state
    } finally {
      setLoading(false);
    }
  }, [search, sort, page]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchQuestions();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="mb-8 bg-lamp-radial rounded-2xl border border-border p-8 sm:p-10">
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-chalk mb-2">
          Stuck on a doubt? <span className="text-amber">Someone here can solve it.</span>
        </h1>
        <p className="text-muted text-sm sm:text-base mb-5 max-w-xl">
          Post your question, get matched with peers skilled in that topic in real time, and build your
          reputation by helping others back.
        </p>
        {!isAuthenticated && (
          <Link to="/register" className="btn-primary inline-block">
            Get Started — It's Free
          </Link>
        )}
        {isAuthenticated && (
          <Link to="/ask" className="btn-primary inline-block">
            Ask Your First Doubt
          </Link>
        )}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <input
            className="input-field"
            placeholder="Search doubts by keyword, e.g. 'JWT authentication'..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setSort(f.key);
                setPage(1);
              }}
              className={`text-sm px-3.5 py-2 rounded-lg border transition-colors ${
                sort === f.key
                  ? "bg-amber/15 border-amber text-amber-light"
                  : "border-border text-muted hover:border-amber/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Questions list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
        </div>
      ) : questions.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-chalk font-display font-semibold mb-1">No doubts found</p>
          <p className="text-muted text-sm">Try a different search, or be the first to ask something.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <QuestionCard key={q._id} question={q} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                p === page ? "bg-amber text-ink" : "bg-paperLight text-muted hover:text-chalk"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
