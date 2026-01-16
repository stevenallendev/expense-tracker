import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
const API = "http://localhost:4000";


export default function Login(){
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

async function onSubmit(e) {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // IMPORTANT for sessions
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Login failed");
        setLoading(false);
        return;
      }

      // Logged in successfully
      navigate("/expense-tracker"); // adjust if your route differs
    } catch {
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <main className="content">

      Temp link to <Link to="/expense-tracker">ExpenseTracker</Link>
        <h1 className="title">Login</h1>

        <form className="loginForm" onSubmit={onSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              required
            />
          </label>

          <button type="submit">Log in</button>

          {error && <div style={{ color: "crimson" }}>{error}</div>}
        </form>
              dont have an account? <Link to="/signup">Sign up</Link>
      </main>
    </div>
  );
}
