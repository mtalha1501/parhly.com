const express = require("express");
const { authRequired, requireRole } = require("../middleware/authMiddleware");
const Enrollment = require("../models/Enrollment");

const router = express.Router();

router.get("/ping", authRequired, requireRole("student"), (req, res) => {
  res.json({ ok: true, role: "student", user: req.user });
});

// List the courses the current student is enrolled in (published courses only)
router.get(
  "/enrollments",
  authRequired,
  requireRole("student"),
  async (req, res) => {
    const studentId = req.user.sub;

    const enrollments = await Enrollment.find({ studentId })
      .sort({ enrolledAt: -1, createdAt: -1 })
      .populate({
        path: "courseId",
        match: { isPublished: true },
      });

    const enrolled = (enrollments || [])
      .filter((e) => Boolean(e.courseId))
      .map((e) => ({
        course: e.courseId,
        enrollment: {
          _id: e._id,
          status: e.status,
          completedLessonIds: e.completedLessonIds || [],
          lastLessonId: e.lastLessonId || null,
          enrolledAt: e.enrolledAt,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt,
        },
      }));

    return res.json({ enrolled });
  }
);

module.exports = router;
