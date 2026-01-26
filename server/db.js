// Sets up database for project
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "db.sqlite"));
db.pragma("foreign_keys = ON");

// creates db.users table
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// creates db.expenses table (scoped to user)
db.exec(`
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL CHECK(amount_cents >= 0),
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT "",
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

db.exec(`
CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_paid ON expenses(user_id, paid_at);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
`);


module.exports = db;
