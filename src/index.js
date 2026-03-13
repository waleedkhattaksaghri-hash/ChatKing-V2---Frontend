// index.js — ChatKing API v2
const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Request timing
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    if (ms > 500) console.warn(`SLOW ${req.method} ${req.path} — ${ms}ms`);
    else          console.log(`${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
  });
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/conversations",  require("./routes/conversations"));
app.use("/api/analytics",      require("./routes/analytics"));
app.use("/api/settings",       require("./routes/settings"));
app.use("/api/knowledge",      require("./routes/knowledge"));
app.use("/api/webhook",        require("./routes/webhook"));
app.use("/api/reviews",        require("./routes/reviews"));
app.use("/api/sops",           require("./routes/sops"));
app.use("/api/insights",       require("./routes/insights"));       // NEW v2
app.use("/api/events",         require("./routes/events"));         // NEW v2
app.use("/api/messages",       require("./routes/messages"));       // NEW v2
app.use("/api/organizations",  require("./routes/organizations"));  // NEW v2

app.get("/health", (req, res) => res.json({ status: "ok", version: "2.0.0", timestamp: new Date().toISOString() }));
app.use((req, res) => res.status(404).json({ error: `${req.method} ${req.path} not found` }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: "Internal server error" }); });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`ChatKing API v2 on :${PORT}`));
