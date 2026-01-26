import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
const API = "http://localhost:4000";
import "../styles/auth-pages.css";

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
    document.body.classList.add("authPages");
    return () => document.body.classList.remove("authPages");
  }, []);

  async function onSubmit(e) {
    e.preventDefault();

    if (!email.trim()) return setError("Email is required");
    if (!password) return setError("Password is required");
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
        credentials: "include",
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

      //After successful login, route to this page
      navigate("/expense-tracker");
    } catch {
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <main className="content">

        <div className="authFormContainer">
          <div className="authHeader">

            <img src="/expenseTrackerLogo.png" alt="logo placeholder" className="authLogo" />

            <span className="authTitle">Welcome Back</span>
            <p>Enter your email and password to continue.</p>
          </div>
          <form noValidate className="authForm" onSubmit={onSubmit}>
            <label>
              <input
                name="email"
                placeholder="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
              />
            </label>

            <label>
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
              />
            </label>
            {error && <div className="errorMessage">{error}</div>}

            <button className="authSubmitBtn" type="submit">
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>
          <div className="authLinkContainer">
            <span>Don't have an account? <Link to="/signup">Sign up</Link></span>
          </div>
        </div>
      </main>
    </div>
  );
}
