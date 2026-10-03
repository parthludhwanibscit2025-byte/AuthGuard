const jwt = require("jsonwebtoken");
const { readDb } = require("../database/db");
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return res.status(401).json({ error: "Missing or invalid Authorization header" });
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    const user = readDb().users.find(u => u.id === payload.id);
    if (!user) return res.status(401).json({ error: "User no longer exists" });
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) return res.status(403).json({ error: "Account temporarily locked" });
    req.user = { id: user.id, username: user.username, role: user.role, email: user.email };
    next();
  } catch (err) { return res.status(401).json({ error: "Invalid or expired token" }); }
}
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthenticated" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Insufficient permissions" });
    next();
  };
}
module.exports = { authenticate, authorize, signToken, JWT_SECRET };
