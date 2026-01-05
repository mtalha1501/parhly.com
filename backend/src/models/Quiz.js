const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    prompt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    options: [
      {
        type: String,
        trim: true,
        maxlength: 500,
        default: "",
      },
    ],
    correctOption: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 140,
    },
    deadline: {
      type: Date,
    },
    durationMinutes: {
      type: Number,
      default: 20,
      min: 1,
      max: 600,
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);
