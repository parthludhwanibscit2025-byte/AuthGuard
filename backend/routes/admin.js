const express = require("express");
const { readDb } = require("../database/db");
const { authenticate, authorize } = require("../middleware/auth");
const { getAuditLog } = require("../security/audit");
const router = express.Router();
router.get("/stats", authenticate, authorize("admin"), (req, res) => {
  const db = readDb();
  const byRole = db.users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});
  const locked = db.users.filter(u => u.lockedUntil && new Date(u.lockedUntil) > new Date()).length;
  const recentAudit = getAuditLog(20);
  res.json({ totalUsers: db.users.length, byRole, currentlyLocked: locked, recentFailedLogins: recentAudit.filter(a => a.action === "login" && !a.success).length, auditEntries: db.audit.length });
});
module.exports = router;
