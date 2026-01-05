const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["enrolled", "completed"],
      default: "enrolled",
    },

    // Progress tracking (simple but effective)
    completedLessonIds: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
    ],
    lastLessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
    },

    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// A student can enroll in a course only once
enrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

enrollmentSchema.methods.getProgress = async function getProgress(LessonModel) {
  const total = await LessonModel.countDocuments({
    courseId: this.courseId,
    isPublished: true,
  });
  const completed = (this.completedLessonIds || []).length;
  return { completed, total };
};

module.exports = mongoose.model("Enrollment", enrollmentSchema);
