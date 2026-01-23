import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = "http://localhost:4000";

export default function Signup() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  //for email formatting validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


  function clearFieldError(field) {
    setError((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();

    // ---- Front-end validation ----
    const signupError = {};

    if (!username.trim()) return setError("Username is required");
    if (!firstName.trim()) return setError("First name is required");
    if (!lastName.trim()) return setError("Last name is required");

    if (!email.trim()) return setError("Email is required");
    if (!emailRegex.test(email.trim()))
      return setError("Please enter a valid email (example@domain.com)");

    if (!verifyEmail.trim()) return setError("Please verify your email");
    if (email !== verifyEmail) return setError("Emails do not match");

    if (!password) return setError("Password is required");
    if (!verifyPassword) return setError("Please verify your password");
    if (password !== verifyPassword) return setError("Passwords do not match");


    if (Object.keys(signupError).length > 0) {
      setError(signupError);
      return;
    }

    setError({});
    setLoading(true);


    // ---- Backend call ----
    try {
      const res = await fetch(`${API}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username,
          firstName,
          lastName,
          email,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.field) {
          setError({ [data.field]: data.error });
        } else {
          setError({ form: data.error ?? "Signup failed" });
        }
        return;
      }

      // Signup auto-logs in on your backend
      navigate("/login"); // change if your route differs
    } catch {
      setError({ form: "Unable to connect to server" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <main className="content">
        <h1 className="title">Sign Up</h1>

        <form className="signupForm" onSubmit={onSubmit}>

          <label>
            Username:
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                clearFieldError("username");
              }}
              required
            />
          </label>

          <label>
            First Name:
            <input
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                clearFieldError("firstName");
              }}
              required
            />
          </label>

          <label>
            Last Name:
            <input
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                clearFieldError("lastName");
              }}
              required
            />
          </label>

          <label>
            E-Mail:
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
                clearFieldError("verifyEmail");
              }}
              required
            />
          </label>

          <label>
            Verify E-Mail:
            <input
              type="email"
              value={verifyEmail}
              onChange={(e) => {
                setVerifyEmail(e.target.value);
                clearFieldError("verifyEmail");
              }}
              required
            />
          </label>

          <label>
            Password:
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
                clearFieldError("verifyPassword");
              }}
              required
            />
          </label>

          <label>
            Verify Password:
            <input
              type="password"
              autoComplete="new-password"
              value={verifyPassword}
              onChange={(e) => {
                setVerifyPassword(e.target.value);
                clearFieldError("verifyPassword");
              }}
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
          {error && <div style={{ color: "crimson" }}>{error}</div>}

        </form>
        Already have an account? <Link to="/login">login</Link>
      </main>
    </div>
  );
}
