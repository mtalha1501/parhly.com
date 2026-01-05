const express = require("express");
const { authRequired, requireRole } = require("../middleware/authMiddleware");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

const router = express.Router();

router.get("/ping", authRequired, requireRole("teacher"), (req, res) => {
  res.json({ ok: true, role: "teacher", user: req.user });
});

router.get(
  "/overview",
  authRequired,
  requireRole("teacher"),
  async (req, res) => {
    try {
      const teacherId = req.user?.sub;
      const courses = await Course.find({ teacherId })
        .select("_id isPublished")
        .lean();

      const courseIds = courses.map((c) => c._id);
      let uniqueStudents = 0;

      if (courseIds.length > 0) {
        const distinctStudents = await Enrollment.distinct("studentId", {
          courseId: { $in: courseIds },
        });
        uniqueStudents = distinctStudents.length;
      }

      res.json({
        courses: courses.length,
        students: uniqueStudents,
        active: courses.filter((c) => Boolean(c.isPublished)).length,
      });
    } catch (err) {
      console.error("Failed to load teacher overview", err);
      res.status(500).json({ message: "Failed to load teacher overview" });
    }
  }
);

module.exports = router;
