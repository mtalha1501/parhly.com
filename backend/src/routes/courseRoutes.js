const express = require("express");
const mongoose = require("mongoose");
const { body, param, validationResult } = require("express-validator");

const { authRequired, requireRole } = require("../middleware/authMiddleware");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const Resource = require("../models/Resource");
const Quiz = require("../models/Quiz");
const User = require("../models/User");

const router = express.Router();

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res
      .status(400)
      .json({ message: "Validation error", errors: errors.array() });
    return false;
  }
  return true;
}

async function loadCourse(courseId) {
  if (!mongoose.isValidObjectId(courseId)) return null;
  return Course.findById(courseId);
}

async function loadLesson(courseId, lessonId) {
  if (!mongoose.isValidObjectId(lessonId)) return null;
  return Lesson.findOne({ _id: lessonId, courseId });
}

function isOwner(course, userId) {
  return String(course.teacherId) === String(userId);
}

function toCountMap(rows) {
  const map = new Map();
  for (const row of rows || []) {
    map.set(String(row._id), row.count || 0);
  }
  return map;
}

async function getCourseStats(courseIds) {
  if (!courseIds.length) {
    return {
      lessons: new Map(),
      resources: new Map(),
      quizzes: new Map(),
      enrolled: new Map(),
    };
  }

  const matchStage = { courseId: { $in: courseIds } };

  const [lessonRows, resourceRows, quizRows, enrollmentRows] =
    await Promise.all([
      Lesson.aggregate([
        { $match: matchStage },
        { $group: { _id: "$courseId", count: { $sum: 1 } } },
      ]),
      Resource.aggregate([
        { $match: matchStage },
        { $group: { _id: "$courseId", count: { $sum: 1 } } },
      ]),
      Quiz.aggregate([
        { $match: matchStage },
        { $group: { _id: "$courseId", count: { $sum: 1 } } },
      ]),
      Enrollment.aggregate([
        { $match: matchStage },
        { $group: { _id: "$courseId", count: { $sum: 1 } } },
      ]),
    ]);

  return {
    lessons: toCountMap(lessonRows),
    resources: toCountMap(resourceRows),
    quizzes: toCountMap(quizRows),
    enrolled: toCountMap(enrollmentRows),
  };
}

// List courses
router.get("/", authRequired, async (req, res) => {
  const role = req.user.role;
  const userId = req.user.sub;

  if (role === "teacher") {
    const courses = await Course.find({ teacherId: userId })
      .sort({ createdAt: -1 })
      .lean();
    const courseIds = courses.map((c) => c._id);
    const stats = await getCourseStats(courseIds);
    const coursesWithStats = courses.map((course) => {
      const key = String(course._id);
      return {
        ...course,
        stats: {
          lessons: stats.lessons.get(key) || 0,
          resources: stats.resources.get(key) || 0,
          quizzes: stats.quizzes.get(key) || 0,
          enrolled: stats.enrolled.get(key) || 0,
        },
      };
    });
    return res.json({ courses: coursesWithStats });
  }

  // student
  const courses = await Course.find({ isPublished: true })
    .sort({ createdAt: -1 })
    .lean();
  const courseIds = courses.map((c) => c._id);
  const stats = await getCourseStats(courseIds);
  const coursesWithStats = courses.map((course) => {
    const key = String(course._id);
    return {
      ...course,
      stats: {
        lessons: stats.lessons.get(key) || 0,
        resources: stats.resources.get(key) || 0,
        quizzes: stats.quizzes.get(key) || 0,
        enrolled: stats.enrolled.get(key) || 0,
      },
    };
  });
  return res.json({ courses: coursesWithStats });
});

// Get course details + lessons
router.get(
  "/:courseId",
  authRequired,
  [param("courseId").isString()],
  async (req, res) => {
    if (!validate(req, res)) return;

    const { courseId } = req.params;
    const course = await loadCourse(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const role = req.user.role;
    const userId = req.user.sub;

    if (role === "teacher") {
      if (!isOwner(course, userId))
        return res.status(403).json({ message: "Forbidden" });
    } else {
      // student
      if (!course.isPublished)
        return res.status(403).json({ message: "Course not published" });
    }

    const lessonQuery =
      role === "student"
        ? { courseId: course._id, isPublished: true }
        : { courseId: course._id };

    const lessons = await Lesson.find(lessonQuery).sort({ order: 1 });

    let enrollment = null;
    if (role === "student") {
      enrollment = await Enrollment.findOne({
        courseId: course._id,
        studentId: userId,
      });
    }

    const resources = await Resource.find({ courseId: course._id }).sort({
      createdAt: -1,
    });
    const quizzes = await Quiz.find({ courseId: course._id }).sort({
      createdAt: -1,
    });

    const enrollmentCount = await Enrollment.countDocuments({
      courseId: course._id,
    });

    return res.json({
      course,
      lessons,
      enrollment,
      resources,
      quizzes,
      enrollmentCount,
    });
  }
);

// Teacher creates a course
router.post(
  "/",
  authRequired,
  requireRole("teacher"),
  [
    body("title").isString().trim().isLength({ min: 3, max: 120 }),
    body("subtitle").optional().isString().trim().isLength({ max: 200 }),
    body("about").optional().isString().trim().isLength({ max: 4000 }),
    body("category").optional().isString().trim().isLength({ max: 80 }),
    body("level").optional().isIn(["beginner", "intermediate", "advanced", ""]),
    body("isPublished").optional().isBoolean(),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const teacherId = req.user.sub;
    const course = await Course.create({
      teacherId,
      title: req.body.title,
      subtitle: req.body.subtitle || "",
      about: req.body.about || "",
      category: req.body.category || "",
      level: req.body.level || "",
      isPublished: Boolean(req.body.isPublished),
    });

    return res.status(201).json({ course });
  }
);

// Teacher updates a course
router.patch(
  "/:courseId",
  authRequired,
  requireRole("teacher"),
  [
    param("courseId").isString(),
    body("title").optional().isString().trim().isLength({ min: 3, max: 120 }),
    body("subtitle").optional().isString().trim().isLength({ max: 200 }),
    body("about").optional().isString().trim().isLength({ max: 4000 }),
    body("category").optional().isString().trim().isLength({ max: 80 }),
    body("level").optional().isIn(["beginner", "intermediate", "advanced", ""]),
    body("isPublished").optional().isBoolean(),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!isOwner(course, req.user.sub))
      return res.status(403).json({ message: "Forbidden" });

    const fields = [
      "title",
      "subtitle",
      "about",
      "category",
      "level",
      "isPublished",
    ];
    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(req.body, f))
        course[f] = req.body[f];
    }

    await course.save();
    return res.json({ course });
  }
);

// Teacher adds a lesson
router.post(
  "/:courseId/lessons",
  authRequired,
  requireRole("teacher"),
  [
    param("courseId").isString(),
    body("order").isInt({ min: 1 }),
    body("title").isString().trim().isLength({ min: 2, max: 140 }),
    body("duration").optional().isString().trim().isLength({ max: 40 }),
    body("content").optional().isString().trim().isLength({ max: 20000 }),
    body("isPublished").optional().isBoolean(),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!isOwner(course, req.user.sub))
      return res.status(403).json({ message: "Forbidden" });

    try {
      const lesson = await Lesson.create({
        courseId: course._id,
        order: Number(req.body.order),
        title: req.body.title,
        duration: req.body.duration || "",
        content: req.body.content || "",
        isPublished: Object.prototype.hasOwnProperty.call(
          req.body,
          "isPublished"
        )
          ? Boolean(req.body.isPublished)
          : true,
      });

      return res.status(201).json({ lesson });
    } catch (e) {
      // Duplicate lesson order within the same course
      if (e && e.code === 11000) {
        return res.status(409).json({ message: "Lesson order already exists" });
      }
      throw e;
    }
  }
);

// Teacher updates a lesson
router.patch(
  "/:courseId/lessons/:lessonId",
  authRequired,
  requireRole("teacher"),
  [
    param("courseId").isString(),
    param("lessonId").isString(),
    body("order").optional().isInt({ min: 1 }),
    body("title").optional().isString().trim().isLength({ min: 2, max: 140 }),
    body("duration").optional().isString().trim().isLength({ max: 40 }),
    body("content").optional().isString().trim().isLength({ max: 20000 }),
    body("isPublished").optional().isBoolean(),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!isOwner(course, req.user.sub))
      return res.status(403).json({ message: "Forbidden" });

    if (!mongoose.isValidObjectId(req.params.lessonId)) {
      return res.status(400).json({ message: "Invalid lessonId" });
    }

    const lesson = await Lesson.findOne({
      _id: req.params.lessonId,
      courseId: course._id,
    });
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const fields = ["order", "title", "duration", "content", "isPublished"];
    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(req.body, f)) {
        lesson[f] = req.body[f];
      }
    }

    await lesson.save();
    return res.json({ lesson });
  }
);

// Teacher deletes a lesson
router.delete(
  "/:courseId/lessons/:lessonId",
  authRequired,
  requireRole("teacher"),
  [param("courseId").isString(), param("lessonId").isString()],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!isOwner(course, req.user.sub))
      return res.status(403).json({ message: "Forbidden" });

    if (!mongoose.isValidObjectId(req.params.lessonId)) {
      return res.status(400).json({ message: "Invalid lessonId" });
    }

    const lesson = await Lesson.findOneAndDelete({
      _id: req.params.lessonId,
      courseId: course._id,
    });
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    return res.json({ message: "Lesson deleted" });
  }
);

// Student enroll
router.post(
  "/:courseId/enroll",
  authRequired,
  requireRole("student"),
  [param("courseId").isString()],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!course.isPublished)
      return res.status(403).json({ message: "Course not published" });

    const studentId = req.user.sub;

    const enrollment = await Enrollment.findOneAndUpdate(
      { courseId: course._id, studentId },
      { $setOnInsert: { courseId: course._id, studentId } },
      { upsert: true, new: true }
    );

    return res.status(201).json({ enrollment });
  }
);

// Teacher: list enrolled students for a course
router.get(
  "/:courseId/enrollments",
  authRequired,
  requireRole("teacher"),
  [param("courseId").isString()],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!isOwner(course, req.user.sub))
      return res.status(403).json({ message: "Forbidden" });

    const enrollments = await Enrollment.find({ courseId: course._id })
      .sort({ createdAt: -1 })
      .lean();

    const studentIds = enrollments.map((e) => e.studentId).filter(Boolean);
    const students = await User.find({ _id: { $in: studentIds } })
      .select("name email role")
      .lean();
    const studentMap = new Map(students.map((s) => [String(s._id), s]));

    const merged = enrollments.map((enr) => ({
      ...enr,
      student: studentMap.get(String(enr.studentId)) || null,
    }));

    return res.json({ enrollments: merged });
  }
);

// Student toggle lesson completion
router.post(
  "/:courseId/progress/lessons/:lessonId",
  authRequired,
  requireRole("student"),
  [
    param("courseId").isString(),
    param("lessonId").isString(),
    body("completed").isBoolean(),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const lessonId = req.params.lessonId;
    if (!mongoose.isValidObjectId(lessonId)) {
      return res.status(400).json({ message: "Invalid lessonId" });
    }

    const lesson = await Lesson.findOne({
      _id: lessonId,
      courseId: course._id,
      isPublished: true,
    });
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const enrollment = await Enrollment.findOne({
      courseId: course._id,
      studentId: req.user.sub,
    });
    if (!enrollment) return res.status(403).json({ message: "Not enrolled" });

    const completed = Boolean(req.body.completed);

    const set = new Set(
      (enrollment.completedLessonIds || []).map((x) => String(x))
    );
    if (completed) set.add(String(lesson._id));
    else set.delete(String(lesson._id));

    enrollment.completedLessonIds = Array.from(set);
    enrollment.lastLessonId = lesson._id;

    const lessonsCount = await Lesson.countDocuments({
      courseId: course._id,
      isPublished: true,
    });
    if (
      enrollment.completedLessonIds.length >= lessonsCount &&
      lessonsCount > 0
    ) {
      enrollment.status = "completed";
      enrollment.completedAt = new Date();
    } else {
      enrollment.status = "enrolled";
      enrollment.completedAt = null;
    }

    await enrollment.save();

    return res.json({ enrollment });
  }
);

// Teacher adds a lesson-scoped resource
router.post(
  "/:courseId/lessons/:lessonId/resources",
  authRequired,
  requireRole("teacher"),
  [
    param("courseId").isString(),
    param("lessonId").isString(),
    body("title").isString().trim().isLength({ min: 2, max: 140 }),
    body("type").optional().isIn(["link", "video", "file"]),
    body("url")
      .isString()
      .trim()
      .isLength({ max: 2000 })
      .isURL({ require_protocol: true }),
    body("description").optional().isString().trim().isLength({ max: 4000 }),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!isOwner(course, req.user.sub))
      return res.status(403).json({ message: "Forbidden" });

    const lesson = await loadLesson(course._id, req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const resource = await Resource.create({
      courseId: course._id,
      lessonId: lesson._id,
      title: req.body.title.trim(),
      type: req.body.type || "link",
      url: req.body.url.trim(),
      description: (req.body.description || "").trim(),
    });

    return res.status(201).json({ resource });
  }
);

// List resources for a lesson
router.get(
  "/:courseId/lessons/:lessonId/resources",
  authRequired,
  [param("courseId").isString(), param("lessonId").isString()],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const role = req.user.role;
    const userId = req.user.sub;
    if (role === "teacher") {
      if (!isOwner(course, userId))
        return res.status(403).json({ message: "Forbidden" });
    } else {
      if (!course.isPublished)
        return res.status(403).json({ message: "Course not published" });
    }

    const lesson = await loadLesson(course._id, req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    if (role === "student" && !lesson.isPublished)
      return res.status(403).json({ message: "Lesson not published" });

    const resources = await Resource.find({
      courseId: course._id,
      lessonId: lesson._id,
    }).sort({ createdAt: -1 });

    return res.json({ resources });
  }
);

// Teacher updates a lesson-scoped resource
router.patch(
  "/:courseId/lessons/:lessonId/resources/:resourceId",
  authRequired,
  requireRole("teacher"),
  [
    param("courseId").isString(),
    param("lessonId").isString(),
    param("resourceId").isString(),
    body("title").optional().isString().trim().isLength({ min: 2, max: 140 }),
    body("type").optional().isIn(["link", "video", "file"]),
    body("url")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 2000 })
      .isURL({ require_protocol: true }),
    body("description").optional().isString().trim().isLength({ max: 4000 }),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!isOwner(course, req.user.sub))
      return res.status(403).json({ message: "Forbidden" });

    const lesson = await loadLesson(course._id, req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    if (!mongoose.isValidObjectId(req.params.resourceId)) {
      return res.status(400).json({ message: "Invalid resourceId" });
    }

    const resource = await Resource.findOne({
      _id: req.params.resourceId,
      courseId: course._id,
      lessonId: lesson._id,
    });
    if (!resource)
      return res.status(404).json({ message: "Resource not found" });

    const fields = ["title", "type", "url", "description"];
    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(req.body, f)) {
        resource[f] = req.body[f];
      }
    }

    await resource.save();
    return res.json({ resource });
  }
);

// Teacher deletes a lesson-scoped resource
router.delete(
  "/:courseId/lessons/:lessonId/resources/:resourceId",
  authRequired,
  requireRole("teacher"),
  [
    param("courseId").isString(),
    param("lessonId").isString(),
    param("resourceId").isString(),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!isOwner(course, req.user.sub))
      return res.status(403).json({ message: "Forbidden" });

    const lesson = await loadLesson(course._id, req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    if (!mongoose.isValidObjectId(req.params.resourceId)) {
      return res.status(400).json({ message: "Invalid resourceId" });
    }

    const resource = await Resource.findOneAndDelete({
      _id: req.params.resourceId,
      courseId: course._id,
      lessonId: lesson._id,
    });
    if (!resource)
      return res.status(404).json({ message: "Resource not found" });

    return res.json({ message: "Resource deleted" });
  }
);

// Teacher adds a resource
router.post(
  "/:courseId/resources",
  authRequired,
  requireRole("teacher"),
  [
    param("courseId").isString(),
    body("title").isString().trim().isLength({ min: 2, max: 140 }),
    body("type").optional().isIn(["link", "video", "file"]),
    body("url")
      .isString()
      .trim()
      .isLength({ max: 2000 })
      .isURL({ require_protocol: true }),
    body("description").optional().isString().trim().isLength({ max: 4000 }),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!isOwner(course, req.user.sub))
      return res.status(403).json({ message: "Forbidden" });

    const resource = await Resource.create({
      courseId: course._id,
      title: req.body.title.trim(),
      type: req.body.type || "link",
      url: req.body.url.trim(),
      description: (req.body.description || "").trim(),
    });

    return res.status(201).json({ resource });
  }
);

// Teacher creates a lesson-scoped quiz
router.post(
  "/:courseId/lessons/:lessonId/quizzes",
  authRequired,
  requireRole("teacher"),
  [
    param("courseId").isString(),
    param("lessonId").isString(),
    body("title").isString().trim().isLength({ min: 2, max: 140 }),
    body("deadline").optional().isISO8601(),
    body("durationMinutes").optional().isInt({ min: 1, max: 600 }),
    body("questions").isArray({ min: 1 }),
    body("questions.*.prompt").isString().trim().isLength({ min: 1, max: 500 }),
    body("questions.*.options").isArray({ min: 2, max: 6 }),
    body("questions.*.options.*")
      .isString()
      .trim()
      .isLength({ min: 1, max: 500 }),
    body("questions.*.correctOption").isInt({ min: 0, max: 5 }),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!isOwner(course, req.user.sub))
      return res.status(403).json({ message: "Forbidden" });

    const lesson = await loadLesson(course._id, req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const questions = (req.body.questions || []).map((q) => {
      const options = Array.isArray(q.options) ? q.options : [];
      const cappedOptions = options.slice(0, 6);
      const correctedIndex = Math.min(
        Math.max(0, Number(q.correctOption) || 0),
        Math.max(0, cappedOptions.length - 1)
      );
      return {
        prompt: q.prompt.trim(),
        options: cappedOptions.map((o) => o.trim()),
        correctOption: correctedIndex,
      };
    });

    const quiz = await Quiz.create({
      courseId: course._id,
      lessonId: lesson._id,
      title: req.body.title.trim(),
      deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
      durationMinutes: req.body.durationMinutes
        ? Number(req.body.durationMinutes)
        : 20,
      questions,
    });

    return res.status(201).json({ quiz });
  }
);

// List quizzes for a lesson
router.get(
  "/:courseId/lessons/:lessonId/quizzes",
  authRequired,
  [param("courseId").isString(), param("lessonId").isString()],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const role = req.user.role;
    const userId = req.user.sub;
    if (role === "teacher") {
      if (!isOwner(course, userId))
        return res.status(403).json({ message: "Forbidden" });
    } else {
      if (!course.isPublished)
        return res.status(403).json({ message: "Course not published" });
    }

    const lesson = await loadLesson(course._id, req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    if (role === "student" && !lesson.isPublished)
      return res.status(403).json({ message: "Lesson not published" });

    const quizzes = await Quiz.find({
      courseId: course._id,
      lessonId: lesson._id,
    }).sort({ createdAt: -1 });

    return res.json({ quizzes });
  }
);

// Teacher updates a lesson-scoped quiz
router.patch(
  "/:courseId/lessons/:lessonId/quizzes/:quizId",
  authRequired,
  requireRole("teacher"),
  [
    param("courseId").isString(),
    param("lessonId").isString(),
    param("quizId").isString(),
    body("title").optional().isString().trim().isLength({ min: 2, max: 140 }),
    body("deadline").optional().isISO8601(),
    body("durationMinutes").optional().isInt({ min: 1, max: 600 }),
    body("questions").optional().isArray({ min: 1 }),
    body("questions.*.prompt")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 500 }),
    body("questions.*.options").optional().isArray({ min: 2, max: 6 }),
    body("questions.*.options.*")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 500 }),
    body("questions.*.correctOption").optional().isInt({ min: 0, max: 5 }),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!isOwner(course, req.user.sub))
      return res.status(403).json({ message: "Forbidden" });

    const lesson = await loadLesson(course._id, req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    if (!mongoose.isValidObjectId(req.params.quizId)) {
      return res.status(400).json({ message: "Invalid quizId" });
    }

    const quiz = await Quiz.findOne({
      _id: req.params.quizId,
      courseId: course._id,
      lessonId: lesson._id,
    });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (Object.prototype.hasOwnProperty.call(req.body, "questions")) {
      const questions = (req.body.questions || []).map((q) => {
        const options = Array.isArray(q.options) ? q.options : [];
        const cappedOptions = options.slice(0, 6);
        const correctedIndex = Math.min(
          Math.max(0, Number(q.correctOption) || 0),
          Math.max(0, cappedOptions.length - 1)
        );
        return {
          prompt: (q.prompt || "").trim(),
          options: cappedOptions.map((o) => (o || "").trim()),
          correctOption: correctedIndex,
        };
      });
      quiz.questions = questions;
    }

    const fields = ["title", "deadline", "durationMinutes"];
    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(req.body, f)) {
        quiz[f] =
          f === "deadline" && req.body[f] ? new Date(req.body[f]) : req.body[f];
      }
    }

    if (quiz.durationMinutes) {
      quiz.durationMinutes = Number(quiz.durationMinutes);
    }

    await quiz.save();
    return res.json({ quiz });
  }
);

// Teacher deletes a lesson-scoped quiz
router.delete(
  "/:courseId/lessons/:lessonId/quizzes/:quizId",
  authRequired,
  requireRole("teacher"),
  [
    param("courseId").isString(),
    param("lessonId").isString(),
    param("quizId").isString(),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!isOwner(course, req.user.sub))
      return res.status(403).json({ message: "Forbidden" });

    const lesson = await loadLesson(course._id, req.params.lessonId);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    if (!mongoose.isValidObjectId(req.params.quizId)) {
      return res.status(400).json({ message: "Invalid quizId" });
    }

    const quiz = await Quiz.findOneAndDelete({
      _id: req.params.quizId,
      courseId: course._id,
      lessonId: lesson._id,
    });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    return res.json({ message: "Quiz deleted" });
  }
);

// List resources for a course
router.get(
  "/:courseId/resources",
  authRequired,
  [param("courseId").isString()],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const role = req.user.role;
    const userId = req.user.sub;
    if (role === "teacher") {
      if (!isOwner(course, userId))
        return res.status(403).json({ message: "Forbidden" });
    } else {
      if (!course.isPublished)
        return res.status(403).json({ message: "Course not published" });
    }

    const resources = await Resource.find({ courseId: course._id }).sort({
      createdAt: -1,
    });
    return res.json({ resources });
  }
);

// Teacher updates a resource
router.patch(
  "/:courseId/resources/:resourceId",
  authRequired,
  requireRole("teacher"),
  [
    param("courseId").isString(),
    param("resourceId").isString(),
    body("title").optional().isString().trim().isLength({ min: 2, max: 140 }),
    body("type").optional().isIn(["link", "video", "file"]),
    body("url")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 2000 })
      .isURL({ require_protocol: true }),
    body("description").optional().isString().trim().isLength({ max: 4000 }),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!isOwner(course, req.user.sub))
      return res.status(403).json({ message: "Forbidden" });

    if (!mongoose.isValidObjectId(req.params.resourceId)) {
      return res.status(400).json({ message: "Invalid resourceId" });
    }

    const resource = await Resource.findOne({
      _id: req.params.resourceId,
      courseId: course._id,
    });
    if (!resource)
      return res.status(404).json({ message: "Resource not found" });

    const fields = ["title", "type", "url", "description"];
    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(req.body, f)) {
        resource[f] = req.body[f];
      }
    }

    await resource.save();
    return res.json({ resource });
  }
);

// Teacher deletes a resource
router.delete(
  "/:courseId/resources/:resourceId",
  authRequired,
  requireRole("teacher"),
  [param("courseId").isString(), param("resourceId").isString()],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!isOwner(course, req.user.sub))
      return res.status(403).json({ message: "Forbidden" });

    if (!mongoose.isValidObjectId(req.params.resourceId)) {
      return res.status(400).json({ message: "Invalid resourceId" });
    }

    const resource = await Resource.findOneAndDelete({
      _id: req.params.resourceId,
      courseId: course._id,
    });
    if (!resource)
      return res.status(404).json({ message: "Resource not found" });

    return res.json({ message: "Resource deleted" });
  }
);

// Teacher creates a quiz
router.post(
  "/:courseId/quizzes",
  authRequired,
  requireRole("teacher"),
  [
    param("courseId").isString(),
    body("title").isString().trim().isLength({ min: 2, max: 140 }),
    body("deadline").optional().isISO8601(),
    body("durationMinutes").optional().isInt({ min: 1, max: 600 }),
    body("questions").isArray({ min: 1 }),
    body("questions.*.prompt").isString().trim().isLength({ min: 1, max: 500 }),
    body("questions.*.options").isArray({ min: 2, max: 6 }),
    body("questions.*.options.*")
      .isString()
      .trim()
      .isLength({ min: 1, max: 500 }),
    body("questions.*.correctOption").isInt({ min: 0, max: 5 }),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!isOwner(course, req.user.sub))
      return res.status(403).json({ message: "Forbidden" });

    const questions = (req.body.questions || []).map((q) => {
      const options = Array.isArray(q.options) ? q.options : [];
      const cappedOptions = options.slice(0, 6);
      const correctedIndex = Math.min(
        Math.max(0, Number(q.correctOption) || 0),
        Math.max(0, cappedOptions.length - 1)
      );
      return {
        prompt: q.prompt.trim(),
        options: cappedOptions.map((o) => o.trim()),
        correctOption: correctedIndex,
      };
    });

    const quiz = await Quiz.create({
      courseId: course._id,
      title: req.body.title.trim(),
      deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
      durationMinutes: req.body.durationMinutes
        ? Number(req.body.durationMinutes)
        : 20,
      questions,
    });

    return res.status(201).json({ quiz });
  }
);

// List quizzes for a course
router.get(
  "/:courseId/quizzes",
  authRequired,
  [param("courseId").isString()],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const role = req.user.role;
    const userId = req.user.sub;
    if (role === "teacher") {
      if (!isOwner(course, userId))
        return res.status(403).json({ message: "Forbidden" });
    } else {
      if (!course.isPublished)
        return res.status(403).json({ message: "Course not published" });
    }

    const quizzes = await Quiz.find({ courseId: course._id }).sort({
      createdAt: -1,
    });
    return res.json({ quizzes });
  }
);

// Teacher updates a quiz
router.patch(
  "/:courseId/quizzes/:quizId",
  authRequired,
  requireRole("teacher"),
  [
    param("courseId").isString(),
    param("quizId").isString(),
    body("title").optional().isString().trim().isLength({ min: 2, max: 140 }),
    body("deadline").optional().isISO8601(),
    body("durationMinutes").optional().isInt({ min: 1, max: 600 }),
    body("questions").optional().isArray({ min: 1 }),
    body("questions.*.prompt")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 500 }),
    body("questions.*.options").optional().isArray({ min: 2, max: 6 }),
    body("questions.*.options.*")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 500 }),
    body("questions.*.correctOption").optional().isInt({ min: 0, max: 5 }),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!isOwner(course, req.user.sub))
      return res.status(403).json({ message: "Forbidden" });

    if (!mongoose.isValidObjectId(req.params.quizId)) {
      return res.status(400).json({ message: "Invalid quizId" });
    }

    const quiz = await Quiz.findOne({
      _id: req.params.quizId,
      courseId: course._id,
    });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (Object.prototype.hasOwnProperty.call(req.body, "questions")) {
      const questions = (req.body.questions || []).map((q) => {
        const options = Array.isArray(q.options) ? q.options : [];
        const cappedOptions = options.slice(0, 6);
        const correctedIndex = Math.min(
          Math.max(0, Number(q.correctOption) || 0),
          Math.max(0, cappedOptions.length - 1)
        );
        return {
          prompt: (q.prompt || "").trim(),
          options: cappedOptions.map((o) => (o || "").trim()),
          correctOption: correctedIndex,
        };
      });
      quiz.questions = questions;
    }

    const fields = ["title", "deadline", "durationMinutes"];
    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(req.body, f)) {
        quiz[f] =
          f === "deadline" && req.body[f] ? new Date(req.body[f]) : req.body[f];
      }
    }

    if (quiz.durationMinutes) {
      quiz.durationMinutes = Number(quiz.durationMinutes);
    }

    await quiz.save();
    return res.json({ quiz });
  }
);

// Teacher deletes a quiz
router.delete(
  "/:courseId/quizzes/:quizId",
  authRequired,
  requireRole("teacher"),
  [param("courseId").isString(), param("quizId").isString()],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!isOwner(course, req.user.sub))
      return res.status(403).json({ message: "Forbidden" });

    if (!mongoose.isValidObjectId(req.params.quizId)) {
      return res.status(400).json({ message: "Invalid quizId" });
    }

    const quiz = await Quiz.findOneAndDelete({
      _id: req.params.quizId,
      courseId: course._id,
    });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    return res.json({ message: "Quiz deleted" });
  }
);

// Student submits a quiz attempt (stored transiently for now)
router.post(
  "/:courseId/quizzes/:quizId/submit",
  authRequired,
  requireRole("student"),
  [
    param("courseId").isString(),
    param("quizId").isString(),
    body("score").optional().isString(),
    body("answers").optional().isObject(),
  ],
  async (req, res) => {
    if (!validate(req, res)) return;

    const course = await loadCourse(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!course.isPublished)
      return res.status(403).json({ message: "Course not published" });

    if (!mongoose.isValidObjectId(req.params.quizId)) {
      return res.status(400).json({ message: "Invalid quizId" });
    }

    const quiz = await Quiz.findOne({
      _id: req.params.quizId,
      courseId: course._id,
    });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const enrollment = await Enrollment.findOne({
      courseId: course._id,
      studentId: req.user.sub,
    });
    if (!enrollment) return res.status(403).json({ message: "Not enrolled" });

    return res.json({ message: "Submission received" });
  }
);

module.exports = router;
