import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import api from "../api/axios.js";
import { useSocket } from "../context/SocketContext.jsx";

const NotificationDropdown = ({ onClose }) => {
  const { notifications, setNotifications } = useSocket();
  const [serverNotifs, setServerNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await api.get("/users/notifications");
        setServerNotifs(data.notifications);
        api.put("/users/notifications/read"); // fire and forget
      } catch {
        // silently ignore - non-critical UI
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  // Merge live socket notifications (newest) with fetched history, de-duplicated by _id
  const merged = [...notifications, ...serverNotifs].filter(
    (n, idx, arr) => arr.findIndex((x) => x._id === n._id) === idx
  );

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 mt-2 w-80 card z-50 animate-fade-in overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-display font-semibold text-sm">
          Notifications
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <p className="text-muted text-sm p-4">Loading...</p>
          ) : merged.length === 0 ? (
            <p className="text-muted text-sm p-4">No notifications yet. Ask or answer a doubt to get started.</p>
          ) : (
            merged.slice(0, 15).map((n) => (
              <Link
                key={n._id}
                to={n.relatedQuestion?._id ? `/questions/${n.relatedQuestion._id}` : n.relatedQuestion ? `/questions/${n.relatedQuestion}` : "#"}
                onClick={onClose}
                className="block px-4 py-3 border-b border-border last:border-0 hover:bg-paperLight transition-colors"
              >
                <p className="text-sm text-chalk leading-snug">{n.message}</p>
                <p className="text-xs text-muted mt-1">
                  {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : "just now"}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationDropdown;
