const { readDb, writeDb } = require("../database/db");
function logAudit(entry) {
  const db = readDb();
  const record = { id: (db.audit.length ? Math.max(...db.audit.map(a => a.id)) : 0) + 1, timestamp: new Date().toISOString(), ...entry };
  db.audit.unshift(record);
  if (db.audit.length > 500) db.audit = db.audit.slice(0, 500);
  writeDb(db);
  return record;
}
function getAuditLog(limit = 50) {
  return readDb().audit.slice(0, limit);
}
module.exports = { logAudit, getAuditLog };
