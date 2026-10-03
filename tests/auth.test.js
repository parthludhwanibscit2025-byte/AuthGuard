const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
process.env.JWT_SECRET = "test-secret-key-for-authguard";
process.env.FAILED_LOGIN_LIMIT = "5";
process.env.LOCKOUT_MINUTES = "15";
const dbPath = path.join(__dirname, "../backend/database/data.json");
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
const app = require("../backend/app");
const { seedPasswords } = require("../backend/database/userSchema");
const { readDb, writeDb } = require("../backend/database/db");
let server, baseUrl;
before(async () => {
  const db = readDb();
  if (await seedPasswords(db)) writeDb(db);
  await new Promise(resolve => { server = app.listen(0, () => { baseUrl = `http://127.0.0.1:${server.address().port}`; resolve(); }); });
});
async function request(method, urlPath, body, token, extraHeaders = {}) {
  const headers = { "Content-Type": "application/json", ...extraHeaders };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(baseUrl + urlPath, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}
describe("AuthGuard API", () => {
  it("health check", async () => { const { status, data } = await request("GET", "/api/health"); assert.equal(status, 200); assert.equal(data.status, "ok"); });
  it("login with demo admin", async () => { const { status, data } = await request("POST", "/api/auth/login", { username: "yug", password: "admin123" }); assert.equal(status, 200); assert.ok(data.token); assert.equal(data.user.role, "admin"); });
  it("reject bad password", async () => { const { status } = await request("POST", "/api/auth/login", { username: "yug", password: "wrong" }); assert.equal(status, 401); });
  it("register new user and access profile", async () => {
    const uname = "testuser_" + Date.now();
    const { status, data } = await request("POST", "/api/auth/register", { username: uname, email: `${uname}@test.local`, password: "secret123", role: "user" });
    assert.equal(status, 201); assert.ok(data.token);
    const profile = await request("GET", "/api/profile", null, data.token); assert.equal(profile.status, 200); assert.equal(profile.data.username, uname);
  });
  it("RBAC: user cannot access admin route", async () => {
    const { data: login } = await request("POST", "/api/auth/login", { username: "demo", password: "user123" });
    const { status } = await request("GET", "/api/admin", null, login.token); assert.equal(status, 403);
  });
  it("admin can access admin route", async () => {
    const { data: login } = await request("POST", "/api/auth/login", { username: "yug", password: "admin123" });
    const { status } = await request("GET", "/api/admin", null, login.token); assert.equal(status, 200);
  });
  it("risk engine returns level", async () => {
    const { data: login } = await request("POST", "/api/auth/login", { username: "yug", password: "admin123" });
    const { status, data } = await request("GET", "/api/risk", null, login.token, { "x-device-trust": "unknown", "x-location": "unusual", "x-sensitive-action": "true" });
    assert.equal(status, 200); assert.ok(["low", "medium", "high"].includes(data.level)); assert.ok(data.score >= 60);
  });
});
