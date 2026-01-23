import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";
const API = "http://localhost:4000";


export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  //for email formatting validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


  //loads login page style on mount for login page only body.LoginPage{}
  useEffect(() => {
    document.body.classList.add("loginPage");
    return () => document.body.classList.remove("loginPage");
  }, []);

  async function onSubmit(e) {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email (example@domain.com)");
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

        <div className="loginFormContainer">
          <div className="loginHeader">

            <img src="/public/expenseTrackerLogo.png" alt="logo placeholder" className="authLogo" />

            <span className="loginTitle">Welcome Back</span>
            <p>Enter your email and password to continue.</p>
          </div>
          <form className="loginForm" onSubmit={onSubmit}>
            <label>
              {/* <span>Email: </span> */}
              <input
              name="email"
                placeholder="Enter email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                required
              />
            </label>

            <label>
              {/* <span>Password: </span> */}
              <input
              name="password"
                placeholder="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                required
              />
            </label>

            <button className="loginBtn" type="submit">Sign in</button>

            {error && <div style={{ color: "crimson" }}>{error}</div>}
          </form>
          <div className="signupLinkContainer">
            <span>Don't have an account? <Link to="/signup">Sign up</Link></span>
          </div>
        </div>

      </main>
    </div>
  );
}
