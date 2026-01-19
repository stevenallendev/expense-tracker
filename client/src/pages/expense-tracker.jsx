import { useEffect, useMemo, useState } from "react";
import { todayYYYYMMDD, formatMMDDYYYY } from "../utils/DateFormatter";
import { dollarsToCents } from "../utils/ParseDollarsToCents";
import { Link, useNavigate } from "react-router-dom";
import useFilteredExpenses from "../hooks/FilteredExpenses.js";

const API = "http://localhost:4000";

export default function Tracker() {
  const navigate = useNavigate();

  // Create Add Expense form
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayYYYYMMDD());
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");

  // Toggle Add Expense form
  const [showAddForm, setShowAddForm] = useState(false);



  // Data and Status
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // EDIT row
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState(todayYYYYMMDD());
  const [editCategory, setEditCategory] = useState("Food");
  const [editDescription, setEditDescription] = useState("");
  const [updating, setUpdating] = useState(false);

  //Category Filter
  const [categoryFilter, setCategoryFilter] = useState("All");

  //Date Filter
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  //For User Information
  const [user, setUser] = useState(null);

  //For Logging Out
  const [loggingOut, setLoggingOut] = useState(false);


  const categories = useMemo(
    () => ["Food", "Gas", "Bills", "Shopping", "Entertainment", "Other"],
    []
  );


  //for "Month" search
  const months = useMemo(
    () => [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    []
  );


  //for "Year" search
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear + 1; y >= 2000; y--) years.push(String(y));
    return years;
  }, []);


  const filteredExpenses = useFilteredExpenses({
    expenses,
    categoryFilter,
    month,
    year,
    months,
  });

  async function loadExpenses() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/api/expenses`, {
        credentials: "include",
      });

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

  const totalCents = useMemo(() => {
    return filteredExpenses.reduce(
      (sum, e) => sum + e.amount_cents,
      0
    );
  }, [filteredExpenses]);

  const totalDollars = (totalCents / 100).toFixed(2);



  //get user information on new session
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch(`${API}/api/me`, {
          credentials: "include",
        });

        if (!res.ok) {
          navigate("/login");
          return;
        }

        const data = await res.json();
        setUser(data.user);
      } catch {
        navigate("/login");
      }
    }

    loadUser();
  }, []);


  //terminate session on logout
  async function onLogout() {
    setLoggingOut(true);
    setError("");

    try {
      await fetch(`${API}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Even if the server is down, treat it like "logged out" on the client.
    } finally {
      setLoggingOut(false);
      navigate("/login");
    }
  }


  // load expenses once and only once on sign in
  useEffect(() => {
    loadExpenses();
  }, []);

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
        body: JSON.stringify({
          amount_cents,
          date,
          category,
          description,
        }),
      });

      const data = await res.json();
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


  //expense delete functions
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


  //expense edit functions
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
        setUpdating(false);
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

















  return (
    <main className="content">
      {user && (
        <p className="welcomeText">
          Welcome, <strong>{user.username} </strong>
          <button
            type="button"
            className="logoutBtn"
            onClick={onLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out..." : "Temp logoutbutton placeholder"}
          </button>
        </p>
      )}
      <h1 className="title">Expense Tracker</h1>


      {/* Expense Section ------------------------------------------------------------------------ */}
      <div className="expenseSection">
        <div className="leftColumn">
          <section className="expenseFormContainer">

            <button
              type="button"
              className="addExpenseToggleBtn"
              onClick={() => setShowAddForm((v) => !v)}
              aria-expanded={showAddForm}
            >
              {showAddForm ? "- Close" : "+ Add Expense"}
            </button>

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
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
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
                    onInvalid={(e) => e.target.setCustomValidity("Description Required")}
                    onInput={(e) => e.target.setCustomValidity("")}
                  />
                </label>

                <div className="addExpenseActions">
                  <button className="addExpenseBtn" type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Add Expense"}
                  </button>

                  <button
                    type="button"
                    className="cancelAddBtn"
                    onClick={() => setShowAddForm(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>

                {error && <div className="errorMessage">{error}</div>}
              </form>
            )}
          </section>


          {/* Expenses Section ----------------------------------------------------------------------------------------------------------- */}
          <section className="expenseDataContainer">
            <h2>Expenses</h2>

            <h3>
              Search:{" "}
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
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
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

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

              <label>
                <br />
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
            </h3>

            {loading ? (
              <p>Loading...</p>
            ) : expenses.length === 0 ? (
              <p>No expenses yet.</p>
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
                      editingId === e.id ? (
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
                          <td>{e.description}</td>
                          <td className="amountCol">
                            ${(e.amount_cents / 100).toFixed(2)}
                          </td>

                          <td className="actions">
                            <button
                              className="iconButton edit"
                              onClick={() => startEdit(e)}
                              title="Edit expense"
                              aria-label="Edit expense"
                              disabled={editingId !== null}
                              type="button"
                            >
                              ✏️
                            </button>

                            <button
                              className="iconButton delete"
                              onClick={() => onDelete(e.id)}
                              title="Delete expense"
                              aria-label="Delete expense"
                              disabled={editingId !== null}
                              type="button"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}


            <br />
            <br />
            <p>Filtered total amount placeholder: ${totalDollars}</p>



          </section>
        </div>
        <div className="rightColumn">
          <section className="futureExpenses">
            <h3>Future Expenses</h3>
            to do in this area: <br />
            past due expenses float to top and become red - maybe separate closed off Section <br />
            remaining stay below <br />
            all future expenses witll have a "mark as paid" button of some sort <br />
            button will ask y/n confirmation <br />
            y-confirmed expenses will be moved to normal expenses section

          </section>
        </div>



      </div>
    </main>
  );
}
