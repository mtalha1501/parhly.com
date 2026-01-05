const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    subtitle: { type: String, default: "", trim: true, maxlength: 200 },
    about: { type: String, default: "", trim: true, maxlength: 4000 },

    // Teacher who owns/created the course
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Optional taxonomy
    category: { type: String, default: "", trim: true, maxlength: 80 },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", ""],
      default: "",
    },

    // Publishing controls
    isPublished: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

courseSchema.index({ teacherId: 1, createdAt: -1 });

module.exports = mongoose.model("Course", courseSchema);
