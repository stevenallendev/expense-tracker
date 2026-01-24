import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";

export default function TrackerLayout() {
  return (
    <>
      <Navbar />
      <main className="content">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
