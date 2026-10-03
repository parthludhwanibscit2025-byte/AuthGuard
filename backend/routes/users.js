const express = require("express");
const { readDb } = require("../database/db");
const { authenticate, authorize } = require("../middleware/auth");
const router = express.Router();
router.get("/", authenticate, authorize("admin"), (req, res) => {
  const users = readDb().users.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role, failedAttempts: u.failedAttempts, lockedUntil: u.lockedUntil, createdAt: u.createdAt, lastLogin: u.lastLogin }));
  res.json({ users });
});
module.exports = router;
