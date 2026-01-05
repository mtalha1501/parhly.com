const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["link", "video", "file"],
      default: "link",
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 4000,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resource", resourceSchema);
