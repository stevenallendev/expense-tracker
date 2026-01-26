import "../styles/footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footerContent">
        <span>© {new Date().getFullYear()} ExpenseTracker</span>
        <span className="footerRight">Project #1</span>
      </div>
    </footer>
  );
}
