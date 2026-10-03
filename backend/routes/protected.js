const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const { calculateRisk } = require("../security/riskEngine");
const { readDb } = require("../database/db");
const router = express.Router();
router.get("/profile", authenticate, (req, res) => {
  const user = readDb().users.find(u => u.id === req.user.id);
  res.json({ id: user.id, username: user.username, email: user.email, role: user.role, lastLogin: user.lastLogin, createdAt: user.createdAt });
});
router.get("/risk", authenticate, (req, res) => {
  const user = readDb().users.find(u => u.id === req.user.id);
  const risk = calculateRisk({ failedAttempts: user.failedAttempts || 0, deviceTrust: req.headers["x-device-trust"] || "known", location: req.headers["x-location"] || "usual", sensitiveAction: req.headers["x-sensitive-action"] || false });
  res.json({ user: req.user.username, ...risk });
});
router.get("/protected", authenticate, (req, res) => res.json({ message: "You have access to a protected resource", user: req.user }));
router.get("/manager", authenticate, authorize("manager", "admin"), (req, res) => res.json({ message: "Manager-level resource", user: req.user }));
router.get("/admin", authenticate, authorize("admin"), (req, res) => res.json({ message: "Admin-level resource", user: req.user }));
module.exports = router;
