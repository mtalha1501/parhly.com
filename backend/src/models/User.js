const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["student", "teacher"], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
