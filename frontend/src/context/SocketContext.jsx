import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Connect once; join/leave the user's private notification room as auth state changes
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, { autoConnect: true });
    }
    const socket = socketRef.current;

    if (user?._id) {
      socket.emit("joinUserRoom", user._id);
    }

    const handleNewNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      // Live toast — this is the "real-time doubt matching" moment made visible
      toast(notif.message, {
        icon: "🔔",
        style: {
          background: "#1B1F2A",
          color: "#E8E6DF",
          border: "1px solid #F2A93B",
        },
      });
    };

    socket.on("newNotification", handleNewNotification);

    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, [user]);

  const clearUnread = () => setUnreadCount(0);

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, notifications, unreadCount, clearUnread, setNotifications }}
    >
      {children}
    </SocketContext.Provider>
  );
};
