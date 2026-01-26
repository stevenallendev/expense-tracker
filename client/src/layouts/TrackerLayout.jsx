import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";


//Renders page content between navbar and footer
//Allows placement of navbar and footer on specific pages only
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
