// server/routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");

module.exports = function authRoutes(db) {
  const router = express.Router();

  // Signup (does NOT auto-login)
  router.post("/signup", async (req, res) => {
    const { username, firstName, lastName, email, password } = req.body ?? {};

    if (!username?.trim()) return res.status(400).json({ field: "username", error: "Username is required" });
    if (!firstName?.trim()) return res.status(400).json({ field: "firstName", error: "First name is required" });
    if (!lastName?.trim()) return res.status(400).json({ field: "lastName", error: "Last name is required" });
    if (!email?.trim()) return res.status(400).json({ field: "email", error: "Email is required" });
    if (!password) return res.status(400).json({ field: "password", error: "Password is required" });

    try {
      const password_hash = await bcrypt.hash(password, 10);
      const created_at = new Date().toISOString();

      db.prepare(`
        INSERT INTO users (username, first_name, last_name, email, password_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
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
      if (msg.includes("users.username")) return res.status(409).json({ field: "username", error: "Username already taken" });
      if (msg.includes("users.email")) return res.status(409).json({ field: "email", error: "Email already in use" });

      console.error(err);
      return res.status(500).json({ error: "Signup failed" });
    }
  });

  // Login
  router.post("/login", async (req, res) => {
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
      return res.json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Login failed" });
    }
  });

  // Me
  router.get("/me", (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ error: "Not logged in" });

    const user = db
      .prepare("SELECT id, username, email FROM users WHERE id = ?")
      .get(req.session.userId);

    if (!user) return res.status(401).json({ error: "Not logged in" });

    return res.json({ user });
  });

  // Logout
  router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Logout failed" });
      }

      res.clearCookie("connect.sid", {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      });

      return res.json({ ok: true });
    });
  });

  return router;
};
