// Handles real-time connections for live doubt-matching, notifications,
// and question discussion "typing" presence.
const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Each logged-in user joins a private room keyed by their own userId.
    // This lets the backend target notifications directly at that user
    // (see questionController / answerController -> io.to(userId).emit(...)).
    socket.on("joinUserRoom", (userId) => {
      if (userId) {
        socket.join(userId);
        console.log(`👤 User ${userId} joined their notification room`);
      }
    });

    // Optional: presence in a question's discussion thread (e.g. "X is typing an answer")
    socket.on("joinQuestionRoom", (questionId) => {
      if (questionId) socket.join(`question_${questionId}`);
    });

    socket.on("leaveQuestionRoom", (questionId) => {
      if (questionId) socket.leave(`question_${questionId}`);
    });

    socket.on("typingAnswer", ({ questionId, userName }) => {
      socket.to(`question_${questionId}`).emit("userTyping", { userName });
    });

    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
};

export default socketHandler;
