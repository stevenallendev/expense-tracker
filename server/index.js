const express = require("express");
const cors = require("cors");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const bcrypt = require("bcrypt");

const Database = require("better-sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: true,
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
      secure: false, // true only with https
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: "Not logged in" });
  next();}

// --- SQLite setup ---
const db = new Database(path.join(__dirname, "db.sqlite"));
db.pragma("foreign_keys = ON");

// Create tables (if they dont exist)
db.exec(`
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount_cents INTEGER NOT NULL CHECK(amount_cents >= 0),
  date TEXT NOT NULL,          -- YYYY-MM-DD
  category TEXT NOT NULL,
  description TEXT DEFAULT "",
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`);

// Health
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// READ: list expenses
app.get("/api/expenses", requireAuth, (req, res) => {
  const rows = db
    .prepare("SELECT * FROM expenses ORDER BY date DESC, id DESC")
    .all();
  res.json(rows);
});

// CREATE: add expense
app.post("/api/expenses", requireAuth, (req, res) => {
  const { amount_cents, date, category, description = "" } = req.body;

  if (!Number.isInteger(amount_cents) || amount_cents < 0) {
    return res.status(400).json({ error: "amount_cents must be a non-negative integer" });
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "date must be YYYY-MM-DD" });
  }
  if (!category || typeof category !== "string") {
    return res.status(400).json({ error: "category is required" });
  }

  const info = db
    .prepare(
      "INSERT INTO expenses (amount_cents, date, category, description) VALUES (?, ?, ?, ?)"
    )
    .run(amount_cents, date, category.trim(), description.trim());

  const created = db.prepare("SELECT * FROM expenses WHERE id=?").get(info.lastInsertRowid);
  res.status(201).json(created);
});

// Delete: delete expense
app.delete("/api/expenses/:id", requireAuth, (req, res) => {
  const { id } = req.params;

  try {
    const stmt = db.prepare(
      "DELETE FROM expenses WHERE id = ?"
    );

    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

// Update: edit an expense
app.put("/api/expenses/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const { amount_cents, date, category, description } = req.body ?? {};

  // Basic validation
  if (!Number.isInteger(amount_cents) || amount_cents < 0) {
    return res
      .status(400)
      .json({ error: "amount_cents must be a non-negative integer" });
  }
  if (!date || !category) {
    return res.status(400).json({ error: "date and category are required" });
  }

  try {
    const stmt = db.prepare(`
      UPDATE expenses
      SET amount_cents = ?, date = ?, category = ?, description = ?
      WHERE id = ?
    `);

    const result = stmt.run(amount_cents, date, category, description ?? "", id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update expense" });
  }
});

//Signup
app.post("/api/signup", async (req, res) => {
  const { username, firstName, lastName, email, password } = req.body ?? {};

  if (!username?.trim()) return res.status(400).json({ field: "username", error: "Username is required" });
  if (!firstName?.trim()) return res.status(400).json({ field: "firstName", error: "First name is required" });
  if (!lastName?.trim()) return res.status(400).json({ field: "lastName", error: "Last name is required" });
  if (!email?.trim()) return res.status(400).json({ field: "email", error: "Email is required" });
  if (!password) return res.status(400).json({ field: "password", error: "Password is required" });

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const created_at = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO users (username, first_name, last_name, email, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      username.trim(),
      firstName.trim(),
      lastName.trim(),
      email.trim().toLowerCase(),
      password_hash,
      created_at
    );

   return res.status(201).json({ ok: true });


  } catch (err) {
    const msg = String(err);
    if (msg.includes("UNIQUE constraint failed: users.username")) return res.status(409).json({ field: "username", error: "Username already taken" });
    if (msg.includes("UNIQUE constraint failed: users.email")) return res.status(409).json({ field: "email", error: "Email already in use" });

    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});


//Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email?.trim() || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = db
      .prepare("SELECT id, password_hash FROM users WHERE email = ?")
      .get(email.trim().toLowerCase());

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    req.session.userId = user.id;
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

//Logged in - reuturn current users data
app.get("/api/me", (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not logged in" });

  const user = db.prepare("SELECT id, username, email FROM users WHERE id = ?").get(req.session.userId);
  if (!user) return res.status(401).json({ error: "Not logged in" });

  res.json({ user });
});

//Login
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
