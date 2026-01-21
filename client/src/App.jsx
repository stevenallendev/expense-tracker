import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Signup from "./pages/signup";
import ExpenseTracker from "./pages/expense-tracker";
import ProtectedRoute from "./routes/ProtectedRoute";
import TrackerLayout from "./layouts/TrackerLayout";

export default function App() {
  return (
    <div className="page">

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />


        <Route element={<ProtectedRoute />}>
        <Route element={<TrackerLayout />}>
        <Route path="/expense-tracker" element={<ExpenseTracker />} />
        </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </div>
  );
}
