const fs = require("fs");
const path = require("path");
const DB_PATH = path.join(__dirname, "data.json");
const defaultDb = {
  users: [
    { id: 1, username: "yug", email: "yug@authguard.local", passwordHash: "", role: "admin", failedAttempts: 0, lockedUntil: null, createdAt: new Date().toISOString(), lastLogin: null, trustedDevices: ["trusted-device-1"] },
    { id: 2, username: "parth", email: "parth@authguard.local", passwordHash: "", role: "manager", failedAttempts: 0, lockedUntil: null, createdAt: new Date().toISOString(), lastLogin: null, trustedDevices: [] },
    { id: 3, username: "demo", email: "demo@authguard.local", passwordHash: "", role: "user", failedAttempts: 0, lockedUntil: null, createdAt: new Date().toISOString(), lastLogin: null, trustedDevices: [] }
  ],
  audit: [],
  nextUserId: 4
};
function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) { writeDb(defaultDb); return structuredClone(defaultDb); }
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch (err) { return structuredClone(defaultDb); }
}
function writeDb(db) {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8"); } catch (e) {}
}
module.exports = { readDb, writeDb, DB_PATH };
