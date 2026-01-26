import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

const API = "http://localhost:4000";


//Allows only logged in users to see page
export default function ProtectedRoute() {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`${API}/api/me`, {
          credentials: "include",
        });

        if (res.ok) {
          setIsAuthed(true);
        } else {
          setIsAuthed(false);
        }
      } catch {
        setIsAuthed(false);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  if (loading) {
    return <p>Checking session...</p>;
  }

  if (!isAuthed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
