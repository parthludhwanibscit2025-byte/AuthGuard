require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { readDb, writeDb } = require("./database/db");
const { seedPasswords } = require("./database/userSchema");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api", require("./routes/protected"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/audit", require("./routes/audit"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "AuthGuard", timestamp: new Date().toISOString() });
});

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

async function start() {
  const db = readDb();
  if (await seedPasswords(db)) writeDb(db);
  app.listen(PORT, () => console.log(`AuthGuard running at http://localhost:${PORT}`));
}

if (require.main === module) start();

module.exports = app;
