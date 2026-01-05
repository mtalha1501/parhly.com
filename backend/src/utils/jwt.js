const jwt = require("jsonwebtoken");

function signAccessToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  const expiresIn = process.env.JWT_EXPIRES_IN || "2h";
  return jwt.sign(payload, secret, { expiresIn });
}

function verifyAccessToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  return jwt.verify(token, secret);
}

module.exports = { signAccessToken, verifyAccessToken };
