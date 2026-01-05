const express = require("express");
const User = require("../models/User");
const { authRequired } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authRequired, async (req, res) => {
  const userId = req.user.sub;
  const user = await User.findById(userId).select(
    "_id email name role createdAt"
  );
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  });
});

module.exports = router;
