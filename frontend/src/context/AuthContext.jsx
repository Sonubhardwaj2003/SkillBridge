import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, restore session from localStorage + verify token is still valid
  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem("skillbridge_user");
      const token = localStorage.getItem("skillbridge_token");

      if (storedUser && token) {
        try {
          const { data } = await api.get("/auth/me");
          setUser(data.user);
        } catch {
          localStorage.removeItem("skillbridge_token");
          localStorage.removeItem("skillbridge_user");
          setUser(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("skillbridge_token", data.token);
    localStorage.setItem("skillbridge_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("skillbridge_token", data.token);
    localStorage.setItem("skillbridge_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("skillbridge_token");
    localStorage.removeItem("skillbridge_user");
    setUser(null);
  };

  const updateUserInPlace = (updatedFields) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedFields };
      localStorage.setItem("skillbridge_user", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUserInPlace, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
};
