import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import Avatar from "../components/Avatar.jsx";

const rankStyles = [
  "text-amber text-2xl", // 1st
  "text-chalk text-xl", // 2nd
  "text-amber-dark text-xl", // 3rd
];

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get("/users/leaderboard");
        setUsers(data.leaderboard);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display font-bold text-2xl mb-1">Top Contributors</h1>
      <p className="text-muted text-sm mb-6">Ranked by reputation earned from helping peers.</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card divide-y divide-border">
          {users.map((u, idx) => (
            <Link
              key={u._id}
              to={`/profile/${u._id}`}
              className="flex items-center gap-4 p-4 hover:bg-paperLight transition-colors"
            >
              <span className={`font-display font-bold w-8 text-center ${rankStyles[idx] || "text-muted"}`}>
                {idx + 1}
              </span>
              <Avatar name={u.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-chalk truncate">{u.name}</p>
                <p className="text-xs text-muted truncate">{u.college || "SkillBridge Member"}</p>
              </div>
              <div className="flex gap-1.5">
                {u.badges?.slice(-1).map((b) => (
                  <span
                    key={b}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal/10 text-teal border border-teal/30"
                  >
                    {b}
                  </span>
                ))}
              </div>
              <span className="font-display font-bold text-amber">{u.reputation}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
