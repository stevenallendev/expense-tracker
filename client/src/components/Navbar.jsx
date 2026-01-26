import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { capitalize } from "../utils/Capitalize";
import "../styles/navbar.css";


const API = "http://localhost:4000";



export default function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");


  async function onLogout() {
    setLoggingOut(true);
    setError("");

    try {
      await fetch(`${API}/api/logout`, { method: "POST", credentials: "include" });
    } catch {
      // ignore
    } finally {
      setLoggingOut(false);
      navigate("/login");
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/me`, { credentials: "include" });
        if (!res.ok) {
          navigate("/login");
          return;
        }
        const data = await res.json();

        console.log("me: ", data.user);

        setUser(data.user);
      } catch {
        navigate("/login");
      }
    })();
  }, [navigate]);



  return (
    <nav className="navbar">
      <div className="navbarLeft">
      </div>
      <div className="navbarRight">

        {user && (

          <p className="welcomeText">
            Welcome, <strong>{capitalize(user.username)}! </strong>

          </p>
        )}

        <button
          type="button"
          className="logoutBtn"
          onClick={onLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </nav>
  );
}
