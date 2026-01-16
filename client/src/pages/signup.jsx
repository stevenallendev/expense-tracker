import { useState } from "react";
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
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function clearFieldError(field) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();

    // ---- Front-end validation ----
    const signupErrors = {};

    if (!username.trim()) signupErrors.username = "Username is required";
    if (!firstName.trim()) signupErrors.firstName = "First name is required";
    if (!lastName.trim()) signupErrors.lastName = "Last name is required";

    if (!email.trim()) signupErrors.email = "Email is required";
    if (!verifyEmail.trim()) signupErrors.verifyEmail = "Please verify your email";
    if (email && verifyEmail && email !== verifyEmail) {
      signupErrors.verifyEmail = "Emails do not match";
    }

    if (!password) signupErrors.password = "Password is required";
    if (!verifyPassword) signupErrors.verifyPassword = "Please verify your password";
    if (password && verifyPassword && password !== verifyPassword) {
      signupErrors.verifyPassword = "Passwords do not match";
    }

    if (Object.keys(signupErrors).length > 0) {
      setErrors(signupErrors);
      return;
    }

    setErrors({});
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
          setErrors({ [data.field]: data.error });
        } else {
          setErrors({ form: data.error ?? "Signup failed" });
        }
        return;
      }

      // Signup auto-logs in on your backend
      navigate("/login"); // change if your route differs
    } catch {
      setErrors({ form: "Unable to connect to server" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <main className="content">
        <form className="signupForm" onSubmit={onSubmit}>
          {errors.form && <div className="errorMessage">{errors.form}</div>}

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
            {errors.username && <span className="fieldError">{errors.username}</span>}
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
            {errors.firstName && <span className="fieldError">{errors.firstName}</span>}
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
            {errors.lastName && <span className="fieldError">{errors.lastName}</span>}
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
            {errors.email && <span className="fieldError">{errors.email}</span>}
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
            {errors.verifyEmail && <span className="fieldError">{errors.verifyEmail}</span>}
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
            {errors.password && <span className="fieldError">{errors.password}</span>}
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
            {errors.verifyPassword && (
              <span className="fieldError">{errors.verifyPassword}</span>
            )}
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>

        Already have an account? <Link to="/login">login</Link>
      </main>
    </div>
  );
}
