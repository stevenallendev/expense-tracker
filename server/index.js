// server/index.js
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);

const db = require("./db");
const authRoutes = require("./routes/auth");
const expenseRoutes = require("./routes/expenses");

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(
  session({
    store: new SQLiteStore({ db: "sessions.sqlite", dir: "." }),
    secret: "replace-with-a-long-random-string",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

// Public health (optional)
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Mount routes
app.use("/api", authRoutes(db));              // /api/signup, /api/login, /api/logout, /api/me
app.use("/api/expenses", expenseRoutes(db));  // /api/expenses...

const PORT = 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
