// Expense tracker data input, output, etc

const express = require("express");
const requireAuth = require("../middleware/requireAuth");

module.exports = function expenseRoutes(db) {
  const router = express.Router();

  // List expenses for logged-in user
  router.get("/", requireAuth, (req, res) => {
    const userId = req.session.userId;

    const rows = db.prepare(`
      SELECT * FROM expenses
      WHERE user_id = ?
      ORDER BY date DESC, id DESC
    `).all(userId);

    res.json(rows);
  });

  // Create expense
  router.post("/", requireAuth, (req, res) => {
    const userId = req.session.userId;
    const { amount_cents, date, category, description = "" } = req.body ?? {};

    if (!Number.isInteger(amount_cents) || amount_cents < 0) {
      return res.status(400).json({ error: "amount_cents must be a non-negative integer" });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "date must be YYYY-MM-DD" });
    }
    if (!category || typeof category !== "string") {
      return res.status(400).json({ error: "category is required" });
    }

    try {
      const info = db.prepare(`
        INSERT INTO expenses (user_id, amount_cents, date, category, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, amount_cents, date, category.trim(), description.trim());

      const created = db.prepare(`
        SELECT * FROM expenses WHERE id = ? AND user_id = ?
      `).get(info.lastInsertRowid, userId);

      return res.status(201).json(created);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to save expense" });
    }
  });

  // Update expense (only if it belongs to user)
  router.put("/:id", requireAuth, (req, res) => {
    const userId = req.session.userId;
    const { id } = req.params;
    const { amount_cents, date, category, description } = req.body ?? {};

    if (!Number.isInteger(amount_cents) || amount_cents < 0) {
      return res.status(400).json({ error: "amount_cents must be a non-negative integer" });
    }
    if (!date || !category) {
      return res.status(400).json({ error: "date and category are required" });
    }

    const result = db.prepare(`
      UPDATE expenses
      SET amount_cents = ?, date = ?, category = ?, description = ?
      WHERE id = ? AND user_id = ?
    `).run(amount_cents, date, category, description ?? "", id, userId);

    if (result.changes === 0) return res.status(404).json({ error: "Expense not found" });

    return res.json({ ok: true });
  });

  // Delete expense (only if it belongs to user)
  router.delete("/:id", requireAuth, (req, res) => {
    const userId = req.session.userId;
    const { id } = req.params;

    const result = db.prepare(`
      DELETE FROM expenses WHERE id = ? AND user_id = ?
    `).run(id, userId);

    if (result.changes === 0) return res.status(404).json({ error: "Expense not found" });

    return res.json({ ok: true });
  });

  return router;
};
