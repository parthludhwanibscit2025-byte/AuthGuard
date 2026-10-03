const express = require("express");
const bcrypt = require("bcryptjs");
const { readDb, writeDb } = require("../database/db");
const { validateRegisterPayload } = require("../database/userSchema");
const { signToken } = require("../middleware/auth");
const { logAudit } = require("../security/audit");
const { calculateRisk } = require("../security/riskEngine");
const router = express.Router();
const FAILED_LOGIN_LIMIT = parseInt(process.env.FAILED_LOGIN_LIMIT || "5", 10);
const LOCKOUT_MINUTES = parseInt(process.env.LOCKOUT_MINUTES || "15", 10);

router.post("/register", async (req, res) => {
  const { valid, errors, role } = validateRegisterPayload(req.body || {});
  if (!valid) return res.status(400).json({ error: "Validation failed", details: errors });
  const { username, email, password } = req.body;
  const db = readDb();
  if (db.users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) return res.status(409).json({ error: "Username already taken" });
  if (db.users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) return res.status(409).json({ error: "Email already registered" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: db.nextUserId++, username: username.trim(), email: email.trim().toLowerCase(), passwordHash, role, failedAttempts: 0, lockedUntil: null, createdAt: new Date().toISOString(), lastLogin: null, trustedDevices: [] };
  db.users.push(user); writeDb(db);
  logAudit({ action: "register", username: user.username, role: user.role, ip: req.ip, success: true });
  res.status(201).json({ message: "Registration successful", token: signToken(user), user: { id: user.id, username: user.username, email: user.email, role: user.role } });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "username and password required" });
  const db = readDb();
  const user = db.users.find(u => u.username.toLowerCase() === String(username).trim().toLowerCase());
  if (!user) { logAudit({ action: "login", username, success: false, reason: "user_not_found", ip: req.ip }); return res.status(401).json({ error: "Invalid credentials" }); }
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    logAudit({ action: "login", username: user.username, success: false, reason: "locked", ip: req.ip });
    return res.status(403).json({ error: "Account temporarily locked due to failed attempts", lockedUntil: user.lockedUntil, remainingMinutes: Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000) });
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    if (user.failedAttempts >= FAILED_LOGIN_LIMIT) { user.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString(); user.failedAttempts = 0; }
    writeDb(db);
    logAudit({ action: "login", username: user.username, success: false, reason: "bad_password", failedAttempts: user.failedAttempts, locked: Boolean(user.lockedUntil), ip: req.ip });
    return res.status(401).json({ error: "Invalid credentials", remainingAttempts: Math.max(0, FAILED_LOGIN_LIMIT - (user.failedAttempts || 0)) });
  }
  user.failedAttempts = 0; user.lockedUntil = null; user.lastLogin = new Date().toISOString(); writeDb(db);
  const risk = calculateRisk({ failedAttempts: 0, deviceTrust: req.headers["x-device-trust"] || "known", location: req.headers["x-location"] || "usual", sensitiveAction: false });
  logAudit({ action: "login", username: user.username, success: true, role: user.role, riskLevel: risk.level, ip: req.ip });
  res.json({ message: "Login successful", token: signToken(user), user: { id: user.id, username: user.username, email: user.email, role: user.role }, risk });
});
module.exports = router;
