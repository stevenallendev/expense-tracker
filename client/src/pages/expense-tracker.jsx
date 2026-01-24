import { useEffect, useMemo, useState } from "react";
import { todayYYYYMMDD, formatMMDDYYYY } from "../utils/DateFormatter";
import { dollarsToCents } from "../utils/ParseDollarsToCents";
import { Link, useNavigate } from "react-router-dom";
import useFilteredExpenses from "../hooks/FilteredExpenses.js";

const API = "http://localhost:4000";

export default function Tracker() {
  const navigate = useNavigate();

  // -----------------------------
  // State
  // -----------------------------
  // Create Add Expense form
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayYYYYMMDD());
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");

  // Toggle Add Expense form
  const [showAddForm, setShowAddForm] = useState(false);
  // Toggle decription expansion
  const [expandedId, setExpandedId] = useState(null);


  // Data and status
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Edit row
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState(todayYYYYMMDD());
  const [editCategory, setEditCategory] = useState("Food");
  const [editDescription, setEditDescription] = useState("");
  const [updating, setUpdating] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  // User
  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // -----------------------------
  // Constants / helper funcs
  // -----------------------------
  const today = todayYYYYMMDD();
  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  const categories = useMemo(
    () => ["Food", "Gas", "Bills", "Shopping", "Entertainment", "Other"],
    []
  );

  const months = useMemo(
    () => [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ],
    []
  );

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear + 5; y >= 2020; y--) years.push(String(y));
    return years;
  }, [currentYear]);

  function createdDateYYYYMMDD(e) {
    // "2026-01-20 14:03:22" -> "2026-01-20"
    return (e.created_at ?? "").slice(0, 10);
  }

  // -----------------------------
  // Derived data (in dependency order)
  // -----------------------------


  const unpaidExpenses = useMemo(
    () => safeExpenses.filter((e) => !e.paid_at),
    [safeExpenses]
  );

  const pastDueUnpaid = useMemo(
    () => unpaidExpenses.filter((e) => e.date <= today),
    [unpaidExpenses, today]
  );

  const upcomingUnpaid = useMemo(
    () => unpaidExpenses.filter((e) => e.date > today),
    [unpaidExpenses, today]
  );


  // LEFT SIDE
  const paidExpenses = useMemo(
    () => safeExpenses.filter((e) => !!e.paid_at),
    [safeExpenses]
  );


  // Filtered table data MUST come after paidExpenses exists
  const filteredExpenses = useFilteredExpenses({
    expenses: paidExpenses,
    categoryFilter,
    month,
    year,
    months,
  });

  const totalCents = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount_cents, 0),
    [filteredExpenses]
  );
  const totalDollars = (totalCents / 100).toFixed(2);

  const isEditing = (e) => editingId === e.id;

  const isLocked = (e) => editingId !== null && editingId !== e.id;

  // -----------------------------
  // Data loading / handlers
  // -----------------------------


  async function loadExpenses() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/api/expenses`, { credentials: "include" });

      if (res.status === 401) {
        navigate("/login");
        return;
      }

      const data = await res.json().catch(() => []);
      setExpenses(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load expenses. Is the server running?");
    } finally {
      setLoading(false);
    }
  }


  async function setPaid(id, paid) {
    if (typeof paid !== "boolean") {
      console.error("setPaid paid must be boolean, got:", paid, typeof paid);
      return;
    }

    const msg = paid ? "Mark this expense as paid?" : "Mark this expense as unpaid?";
    if (!window.confirm(msg)) return;

    setError("");

    try {
      const res = await fetch(`${API}/api/expenses/${id}/set-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ paid }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Failed to update paid status");
        return;
      }

      await loadExpenses();
    } catch {
      setError("Failed to update paid status");
    }
  }


  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const amount_cents = dollarsToCents(amount);
    if (amount_cents === null || amount_cents < 0) {
      setSaving(false);
      setError("Enter a valid amount (example: 12.99)");
      return;
    }

    try {
      const res = await fetch(`${API}/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount_cents, date, category, description }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to save expense");
      } else {
        setAmount("");
        setDescription("");
        await loadExpenses();
      }
    } catch {
      setError("Failed to save expense");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Delete this expense?")) return;

    const res = await fetch(`${API}/api/expenses/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Failed to delete expense");
      return;
    }

    await loadExpenses();
  }

  function startEdit(expense) {
    setEditingId(expense.id);
    setEditAmount((expense.amount_cents / 100).toFixed(2));
    setEditDate(expense.date);
    setEditCategory(expense.category);
    setEditDescription(expense.description ?? "");
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setUpdating(false);
    setError("");
  }

  async function saveEdit(id) {
    setUpdating(true);
    setError("");

    if (!editDescription.trim()) {
      setUpdating(false);
      setError("Description is required");
      return;
    }

    const amount_cents = dollarsToCents(editAmount);
    if (amount_cents === null || amount_cents < 0) {
      setUpdating(false);
      setError("Enter a valid amount (example: 12.99)");
      return;
    }

    try {
      const res = await fetch(`${API}/api/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount_cents,
          date: editDate,
          category: editCategory,
          description: editDescription,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Failed to update expense");
        return;
      }

      setEditingId(null);
      await loadExpenses();
    } catch {
      setError("Failed to update expense");
    } finally {
      setUpdating(false);
    }
  }

  // Toggle description expansion
  function toggleExpanded(id) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  function truncateText(text, maxLength = 25) {
    if (!text) return "";
    return text.length > maxLength
      ? text.slice(0, maxLength) + "…"
      : text;
  }

  // -----------------------------
  // Effects
  // -----------------------------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/me`, { credentials: "include" });
        if (!res.ok) {
          navigate("/login");
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch {
        navigate("/login");
      }
    })();
  }, [navigate]);

  useEffect(() => {
    loadExpenses();
  }, []);


  //dynamically change "total" label when filtering
  const totalLabel = useMemo(() => {
    if (!month && !year) return "Total";

    if (month && year) return `Total for ${month} ${year}`;
    if (month) return `Total for ${month}`;
    if (year) return `Total for ${year}`;

    return "Total";
  }, [month, year]);





  return (
    <main className="content">
      <p className="title">Title Here</p>

      {/* ===================== LEFT COLUMN ===================== */}

      <div className="expenseSection">
        <div className="leftColumn">
          <section className="expenseFormContainer">
            <div className="columnTitlesContainer">
              <span className="columnTitles">Expenses</span>
            </div>

            <div className="addExpenseHeader">
              <button
                type="button"
                className="addExpenseToggleBtn"
                onClick={() => setShowAddForm((v) => !v)}
                aria-expanded={showAddForm}
              >
                {showAddForm ? "- Close" : "+ Add Expense"}
              </button>
            </div>
            <div className="addExpenseFormContainer">
              {showAddForm && (
                <form className="expenseForm" onSubmit={onSubmit}>
                  <label>
                    <span>Amount (USD)</span>
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="12.99"
                      required
                    />
                  </label>

                  <label>
                    <span>Date</span>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </label>

                  <label>
                    <span>Category</span>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Description</span>
                    <input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Lunch, Netflix, etc."
                      required
                      onInvalid={(e) =>
                        e.target.setCustomValidity("Description Required")
                      }
                      onInput={(e) => e.target.setCustomValidity("")}
                    />
                  </label>

                  <div className="addExpenseBtnContainer">

                    <button
                      type="button"
                      className="cancelAddBtn"
                      onClick={() => setShowAddForm(false)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button className="addExpenseBtn" type="submit" disabled={saving}>
                      {saving ? "Saving..." : "Add Expense"}
                    </button>


                  </div>



                  {error && <div className="errorMessage">{error}</div>}
                </form>
              )}
            </div>

          </section>

          {/* Paid Expenses Table (LEFT) */}
          <section className="expenseDataContainer">
            <div className="filterContainer">
              <div className="filterRow">
                <span>Search:{" "}</span>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  disabled={!year}
                >
                  <option value="">Month</option>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>{" "}
                <select value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">Year</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>{" "}
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter("All");
                    setMonth("");
                    setYear("");
                  }}
                >
                  Clear
                </button>
              </div>
              <div className="filterRow">
                <label>
                  <span>Filter by category</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="All">All</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="totalsContainer">
                <p>
                  {totalLabel} ${totalDollars}
                </p>
              </div>
            </div>
            {loading ? (
              <p>Loading...</p>
            ) : paidExpenses.length === 0 ? (
              <p>No paid expenses yet.</p>
            ) : filteredExpenses.length === 0 ? (
              <p>No results for this filter.</p>
            ) : (
              <div className="expenseTableWrapper">
                <table className="expenseTable">
                  <thead>
                    <tr className="expenseTableTitles">
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th className="amountCol">Amount</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody className="expanseTableInfo">
                    {filteredExpenses.map((e) =>
                      isEditing(e) ? (
                        <tr key={e.id}>
                          <td>
                            <input
                              type="date"
                              value={editDate}
                              onChange={(ev) => setEditDate(ev.target.value)}
                            />
                          </td>

                          <td>
                            <select
                              value={editCategory}
                              onChange={(ev) => setEditCategory(ev.target.value)}
                            >
                              {categories.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td>
                            <input
                              value={editDescription}
                              onChange={(ev) => {
                                setEditDescription(ev.target.value);
                                if (error) setError("");
                              }}
                              placeholder="Lunch, Netflix, etc."
                            />
                          </td>

                          <td className="amountCol">
                            <input
                              value={editAmount}
                              onChange={(ev) => setEditAmount(ev.target.value)}
                              placeholder="12.99"
                            />
                          </td>

                          <td className="actions">
                            <button
                              className="iconButton"
                              onClick={() => saveEdit(e.id)}
                              disabled={updating}
                              title="Save"
                              aria-label="Save"
                              type="button"
                            >
                              💾
                            </button>

                            <button
                              className="iconButton"
                              onClick={cancelEdit}
                              disabled={updating}
                              title="Cancel"
                              aria-label="Cancel"
                              type="button"
                            >
                              ✖️
                            </button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={e.id}>
                          <td>{formatMMDDYYYY(e.date)}</td>
                          <td>{e.category}</td>
                          <td
                            className="descriptionColumn"
                            onClick={() => toggleExpanded(e.id)}
                            style={{ cursor: "pointer" }}
                          >
                            <span className="descriptionText">{truncateText(e.description, 11)}</span>
                            {expandedId === e.id && (
                              <div className="descriptionDropdown">
                                {e.description}
                              </div>
                            )}
                          </td>
                          <td className="amountCol">
                            ${(e.amount_cents / 100).toFixed(2)}
                          </td>

                          <td className="actions">
                            <button
                              className="iconButton edit"
                              onClick={() => startEdit(e)}
                              title="Edit"
                              aria-label="Edit"
                              disabled={isLocked(e)}
                              type="button"
                            >
                              ✏️
                            </button>

                            <button
                              className="iconButton delete"
                              onClick={() => onDelete(e.id)}
                              title="Delete"
                              aria-label="Delete"
                              disabled={isLocked(e)}
                              type="button"
                            >
                              🗑️
                            </button>

                            <button
                              className="iconButton"
                              type="button"
                              onClick={() => setPaid(e.id, false)}
                              disabled={isLocked(e)}
                              title="Mark unpaid"
                            >
                              ✅ Paid
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </section>
        </div>

        {/* ===================== RIGHT COLUMN ===================== */}

        <aside className="rightColumn">
          <div className="columnTitlesContainer">
            <span className="columnTitles">Future Expenses</span>
          </div>
          <div className="rightSection">
            <div className="rightSectionTitlesContainer">
              <span className="rightSectionTitles">Due Soon</span>
            </div>
            {pastDueUnpaid.length === 0 ? (
              <p>None.</p>
            ) : (
              <div className="expenseTableWrapper">
                <table className="expenseTable">
                  <thead>
                    <tr className="expenseTableTitles">
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th className="amountCol">Amount</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody className="pastDueExpensesInfo">
                    {pastDueUnpaid.map((e) =>
                      isEditing(e) ? (
                        <tr key={e.id}>
                          <td>
                            <input
                              type="date"
                              value={editDate}
                              onChange={(ev) => setEditDate(ev.target.value)}
                            />
                          </td>

                          <td>
                            <select
                              value={editCategory}
                              onChange={(ev) => setEditCategory(ev.target.value)}
                            >
                              {categories.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td>
                            <input
                              value={editDescription}
                              onChange={(ev) => {
                                setEditDescription(ev.target.value);
                                if (error) setError("");
                              }}
                              placeholder="Lunch, Netflix, etc."
                            />
                          </td>

                          <td className="amountCol">
                            <input
                              value={editAmount}
                              onChange={(ev) => setEditAmount(ev.target.value)}
                              placeholder="12.99"
                            />
                          </td>

                          <td className="actions">
                            <button
                              className="iconButton"
                              onClick={() => saveEdit(e.id)}
                              disabled={updating}
                              title="Save"
                              aria-label="Save"
                              type="button"
                            >
                              💾
                            </button>

                            <button
                              className="iconButton"
                              onClick={cancelEdit}
                              disabled={updating}
                              title="Cancel"
                              aria-label="Cancel"
                              type="button"
                            >
                              ✖️
                            </button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={e.id} className="futureItem due">
                          <td>{formatMMDDYYYY(e.date)}</td>
                          <td>{e.category}</td>
                          <td>{e.description}</td>
                          <td className="amountCol">
                            ${(e.amount_cents / 100).toFixed(2)}
                          </td>

                          <td className="actions">
                            <button
                              className="iconButton edit"
                              onClick={() => startEdit(e)}
                              disabled={isLocked(e)}
                              type="button"
                              title="Edit"
                            >
                              ✏️
                            </button>

                            <button
                              className="iconButton delete"
                              onClick={() => onDelete(e.id)}
                              disabled={isLocked(e)}
                              type="button"
                              title="Delete"
                            >
                              🗑️
                            </button>

                            <button
                              type="button"
                              title="Mark paid"
                              className="iconButton markPaidBtn"
                              onClick={() => setPaid(e.id, true)}
                              disabled={isLocked(e)}
                            >
                              💲
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="rightSection">
            <div className="rightSectionTitlesContainer">
              <span className="rightSectionTitles">Upcoming</span>
            </div>
            {upcomingUnpaid.length === 0 ? (
              <p>No upcoming.</p>
            ) : (
              <div className="expenseTableWrapper">
                <table className="expenseTable">
                  <thead>
                    <tr className="expenseTableTitles">
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th className="amountCol">Amount</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody className="upcomingInfo">
                    {upcomingUnpaid.map((e) =>
                      isEditing(e) ? (
                        <tr key={e.id}>
                          <td>
                            <input
                              type="date"
                              value={editDate}
                              onChange={(ev) => setEditDate(ev.target.value)}
                            />
                          </td>

                          <td>
                            <select
                              value={editCategory}
                              onChange={(ev) => setEditCategory(ev.target.value)}
                            >
                              {categories.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td>
                            <input
                              value={editDescription}
                              onChange={(ev) => {
                                setEditDescription(ev.target.value);
                                if (error) setError("");
                              }}
                              placeholder="Lunch, Netflix, etc."
                            />
                          </td>

                          <td className="amountCol">
                            <input
                              value={editAmount}
                              onChange={(ev) => setEditAmount(ev.target.value)}
                              placeholder="12.99"
                            />
                          </td>

                          <td className="actions">
                            <button
                              className="iconButton"
                              onClick={() => saveEdit(e.id)}
                              disabled={updating}
                              title="Save"
                              aria-label="Save"
                              type="button"
                            >
                              💾
                            </button>

                            <button
                              className="iconButton"
                              onClick={cancelEdit}
                              disabled={updating}
                              title="Cancel"
                              aria-label="Cancel"
                              type="button"
                            >
                              ✖️
                            </button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={e.id} className="futureItem">
                          <td>{formatMMDDYYYY(e.date)}</td>
                          <td>{e.category}</td>
                          <td>{e.description}</td>
                          <td className="amountCol">
                            ${(e.amount_cents / 100).toFixed(2)}
                          </td>

                          <td className="actions">
                            <button
                              className="iconButton edit"
                              onClick={() => startEdit(e)}
                              disabled={isLocked(e)}
                              type="button"
                              title="Edit"
                            >
                              ✏️
                            </button>

                            <button
                              className="iconButton delete"
                              onClick={() => onDelete(e.id)}
                              disabled={isLocked(e)}
                              type="button"
                              title="Delete"
                            >
                              🗑️
                            </button>

                            <button
                              type="button"
                              title="Mark paid"
                              className="iconButton markPaidBtn"
                              onClick={() => setPaid(e.id, true)}
                              disabled={isLocked(e)}
                            >
                              💲
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );



}
