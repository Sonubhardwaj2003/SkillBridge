import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    college: {
      type: String,
      default: "",
      trim: true,
    },
    branch: {
      type: String,
      default: "",
      trim: true,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 300,
    },
    avatarSeed: {
      type: String,
      default: function () {
        return Math.random().toString(36).substring(2, 10);
      },
    },
    // URL of the uploaded profile photo (Cloudinary). Empty string = no
    // photo uploaded yet, in which case the UI falls back to initials.
    avatarUrl: {
      type: String,
      default: "",
    },
    // Reputation system - core gamification feature
    reputation: {
      type: Number,
      default: 0,
    },
    tags: {
      // topics this user is skilled in / interested in (used for doubt-matching)
      type: [String],
      default: [],
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    // Set by an admin from the moderation dashboard. A banned user's existing
    // token stops working immediately (checked in the protect middleware),
    // not just at their next login.
    isBanned: {
      type: Boolean,
      default: false,
    },
    badges: {
      type: [String],
      default: [],
    },
    questionsAsked: {
      type: Number,
      default: 0,
    },
    answersGiven: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Recalculate badges based on reputation (simple tiered system)
userSchema.methods.refreshBadges = function () {
  const badges = [];
  if (this.reputation >= 10) badges.push("Contributor");
  if (this.reputation >= 50) badges.push("Problem Solver");
  if (this.reputation >= 150) badges.push("Mentor");
  if (this.reputation >= 400) badges.push("SkillBridge Legend");
  this.badges = badges;
};

const User = mongoose.model("User", userSchema);
export default User;
