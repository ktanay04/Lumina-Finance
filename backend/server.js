const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

app.use(
  cors({
    origin: (origin, cb) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV === "production"
      ) {
        return cb(null, true);
      }
      return cb(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/budgets", require("./routes/budgetRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));

if (process.env.NODE_ENV === "production") {
  const dist = path.join(__dirname, "../frontend/dist");
  app.use(express.static(dist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(dist, "index.html"));
  });
} else {
  app.get("/", (_req, res) =>
    res.send("Lumina Finance API — use the Vite dev server on :5173"),
  );
}

const PORT = process.env.PORT || 5000;

/** Options that often fix “could not connect” on home networks (IPv6/DNS quirks). */
const mongooseOptions = {
  serverSelectionTimeoutMS: 15_000,
  // Prefer IPv4 — Atlas SRV + some ISPs/routers fail when Node tries IPv6 first.
  family: 4,
};

function printMongoConnectionHelp(err) {
  const name = err?.name || "";
  const msg = String(err?.message || err || "");
  if (
    name === "MongooseServerSelectionError" ||
    msg.includes("whitelist") ||
    msg.includes("IP that isn")
  ) {
    console.error("\n--- MongoDB Atlas: connection failed ---\n");
    console.error(
      "1) Network Access: https://cloud.mongodb.com → Network Access → Add IP Address.",
    );
    console.error(
      '   For local dev, add "0.0.0.0/0" (allow from anywhere) OR "Add Current IP Address".',
    );
    console.error("   Wait until the rule shows Active (can take ~1 minute).\n");
    console.error("2) Cluster not paused: Database → Clusters → if you see Resume, click it.\n");
    console.error(
      "3) MONGO_URI in project root .env: correct password (URL-encode special chars),",
    );
    console.error("   and a database name in the path, e.g. ...mongodb.net/lumina_finance?...\n");
    console.error("Docs: https://www.mongodb.com/docs/atlas/troubleshoot-connection/\n");
  }
}

async function start() {
  if (!process.env.MONGO_URI) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error("Missing JWT_SECRET in .env");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
  } catch (err) {
    printMongoConnectionHelp(err);
    throw err;
  }
  console.log("MongoDB connected");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
