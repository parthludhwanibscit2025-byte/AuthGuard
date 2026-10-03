const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const { getAuditLog } = require("../security/audit");
const router = express.Router();
router.get("/", authenticate, authorize("admin", "manager"), (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
  const logs = getAuditLog(limit);
  res.json({ count: logs.length, logs });
});
module.exports = router;
