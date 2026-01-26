import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth-pages.css";


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


  useEffect(() => {
    document.body.classList.add("authPages");
    return () => document.body.classList.remove("authPages");
  }, []);

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

    // Front end validation

    const u = username.trim();
    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim();
    const vem = verifyEmail.trim();
    
    if (!u) return setError("Username is required");
    if (!fn) return setError("First name is required");
    if (!ln) return setError("Last name is required");

    if (!em) return setError("Email is required");
    if (!emailRegex.test(email.trim()))
      return setError("Please enter a valid email (example@domain.com)");

    if (!vem) return setError("Please verify your email");
    if (em !== vem) return setError("Emails do not match");

    if (!password) return setError("Password is required");
    if (!verifyPassword) return setError("Please verify your password");
    if (password !== verifyPassword) return setError("Passwords do not match")

    setError("");
    setLoading(true);


    try {
      const res = await fetch(`${API}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: u,
          firstName: fn,
          lastName: ln,
          email: em,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Signup failed");
        return;
      }

      //After POST, route back to login
      navigate("/login",{replace:true});
    } catch {
      setError({ form: "Unable to connect to server" });
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
            <span className="authTitle">Sign up</span>
            <p>Sign up for an account to use Expense Tracker</p>
          </div>
          <form noValidate className="authForm" onSubmit={onSubmit}>

            <label>
              <input
                placeholder="Username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError("");
                }}
              />
            </label>

            <label>
              <input
                placeholder="First Name"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (error) setError("");
                }}
              />
            </label>

            <label>
              <input
                placeholder="Last Name"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (error) setError("");
                }}

              />
            </label>

            <label>
              <input
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
                placeholder="Verify email"
                type="email"
                value={verifyEmail}
                onChange={(e) => {
                  setVerifyEmail(e.target.value);
                  if (error) setError("");
                }}

              />
            </label>

            <label>
              <input
                placeholder="Password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}

              />
            </label>

            <label>
              <input
                placeholder="Verify password"
                type="password"
                autoComplete="new-password"
                value={verifyPassword}
                onChange={(e) => {
                  setVerifyPassword(e.target.value);
                  if (error) setError("");
                }}

              />
            </label>
            {error && <div className="errorMessage">{error}</div>}

            <button className="authSubmitBtn" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </button>

          </form>
          <div className="authLinkContainer">
            <span>Already have an account? <Link to="/login">login</Link></span>
          </div>
        </div>
      </main>
    </div>
  );
}
