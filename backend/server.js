// IMPORTANT: this must be the very first import in the file. ES module imports
// are all evaluated before any other top-level code runs, so if dotenv.config()
// happened after other imports (like the routes below, which pull in the
// Cloudinary config), those modules would read process.env before .env was
// loaded — causing "Must supply api_key" even with a correct .env file.
import "dotenv/config";

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import socketHandler from "./socket/socketHandler.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import answerRoutes from "./routes/answerRoutes.js";
import userRoutes from "./routes/userRoutes.js";

connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup - CORS matches frontend dev server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Make io accessible inside controllers via req.app.get("io")
app.set("io", io);
socketHandler(io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "SkillBridge API is running 🚀" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/answers", answerRoutes);
app.use("/api/users", userRoutes);

// Error handling (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 SkillBridge server running on port ${PORT}`);
});
