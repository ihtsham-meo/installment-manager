import { useEffect, useState } from "react";
import { authService } from "./services/auth";
import Products from "./pages/Products/Products.jsx";
import Customers from "./pages/Customers/Customers.jsx";
import Sales from "./pages/Sales/Sales.jsx";
import Payments from "./pages/Payments/Payments.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Reports from "./pages/Reports/Reports.jsx";
import Backup from "./pages/Backup/Backup.jsx";
import Users from "./pages/Users/Users.jsx";
import Setup from "./pages/Auth/Setup.jsx";
import Login from "./pages/Auth/Login.jsx";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    (async () => {
      const setup = await authService.needsSetup();
      if (setup) {
        setNeedsSetup(true);
        setLoading(false);
        return;
      }
      setUser(await authService.current());
      setLoading(false);
    })();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (needsSetup) return <Setup onDone={() => setNeedsSetup(false)} />;
  if (!user) return <Login onLogin={setUser} />;

  const isAdmin = user.role === "admin";

  return (
    <div>
      <nav>
        <span>
          {user.full_name} ({user.role})
        </span>
        <button onClick={() => setPage("dashboard")}>Dashboard</button>
        <button onClick={() => setPage("products")}>Products</button>
        <button onClick={() => setPage("customers")}>Customers</button>
        <button onClick={() => setPage("sales")}>Sales</button>
        <button onClick={() => setPage("payments")}>Payments</button>
        <button onClick={() => setPage("reports")}>Reports</button>
        <button onClick={() => setPage("backup")}>Backup</button>
        {isAdmin && <button onClick={() => setPage("users")}>Users</button>}
        <button
          onClick={async () => {
            await authService.logout();
            setUser(null);
          }}
        >
          Logout
        </button>
      </nav>
      {page === "dashboard" && <Dashboard />}
      {page === "products" && <Products />}
      {page === "customers" && <Customers />}
      {page === "sales" && <Sales />}
      {page === "payments" && <Payments />}
      {page === "reports" && <Reports />}
      {page === "backup" && <Backup />}
      {page === "users" && isAdmin && <Users />}
    </div>
  );
}
