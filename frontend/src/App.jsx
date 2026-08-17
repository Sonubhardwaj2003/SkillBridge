import React from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import InstallPrompt from "./components/InstallPrompt.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AskQuestion from "./pages/AskQuestion.jsx";
import QuestionDetail from "./pages/QuestionDetail.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Profile from "./pages/Profile.jsx";
import NotFound from "./pages/NotFound.jsx";

function App() {
  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <Toaster position="top-right" />
      <InstallPrompt />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/questions/:id" element={<QuestionDetail />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route
          path="/ask"
          element={
            <ProtectedRoute>
              <AskQuestion />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
