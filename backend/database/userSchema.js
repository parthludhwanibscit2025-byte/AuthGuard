const bcrypt = require("bcryptjs");
const DEMO_PASSWORDS = { yug: "admin123", parth: "manager123", demo: "user123" };
async function seedPasswords(db) {
  let changed = false;
  for (const user of db.users) {
    if (!user.passwordHash && DEMO_PASSWORDS[user.username]) {
      user.passwordHash = await bcrypt.hash(DEMO_PASSWORDS[user.username], 10);
      changed = true;
    }
  }
  return changed;
}
function validateRegisterPayload(body) {
  const errors = [];
  if (!body.username || typeof body.username !== "string" || body.username.trim().length < 3) errors.push("username must be at least 3 characters");
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.push("valid email is required");
  if (!body.password || typeof body.password !== "string" || body.password.length < 6) errors.push("password must be at least 6 characters");
  const role = body.role || "user";
  if (!["user", "manager", "admin"].includes(role)) errors.push("role must be user, manager, or admin");
  return { valid: errors.length === 0, errors, role };
}
module.exports = { seedPasswords, validateRegisterPayload, DEMO_PASSWORDS };
