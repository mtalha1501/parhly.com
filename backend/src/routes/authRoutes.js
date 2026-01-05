const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");

const User = require("../models/User");
const { signAccessToken } = require("../utils/jwt");

const router = express.Router();

function okUser(user) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password")
      .isString()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 chars"),
    body("role")
      .isIn(["student", "teacher"])
      .withMessage("Role must be student or teacher"),
    body("name").optional().isString().isLength({ max: 60 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Validation error", errors: errors.array() });
    }

    const email = String(req.body.email).toLowerCase().trim();
    const password = String(req.body.password);
    const role = req.body.role;
    const name = req.body.name ? String(req.body.name).trim() : "";

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, role, name });

    const token = signAccessToken({
      sub: String(user._id),
      role: user.role,
      email: user.email,
    });

    return res.status(201).json({ user: okUser(user), token });
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isString().withMessage("Password required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Validation error", errors: errors.array() });
    }

    const email = String(req.body.email).toLowerCase().trim();
    const password = String(req.body.password);

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signAccessToken({
      sub: String(user._id),
      role: user.role,
      email: user.email,
    });

    return res.json({ user: okUser(user), token });
  }
);

module.exports = router;
