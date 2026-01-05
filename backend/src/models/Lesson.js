const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    // Display ordering inside a course
    order: { type: Number, required: true, min: 1 },

    title: { type: String, required: true, trim: true, maxlength: 140 },
    duration: { type: String, default: "", trim: true, maxlength: 40 },

    // For now, we store lesson text content; later this can become a rich structure / file refs
    content: { type: String, default: "", trim: true, maxlength: 20000 },

    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Each course can only have one lesson per order number
lessonSchema.index({ courseId: 1, order: 1 }, { unique: true });

module.exports = mongoose.model("Lesson", lessonSchema);
