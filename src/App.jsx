import { useState } from "react";
import Products from "./pages/Products/Products.jsx";
import Customers from "./pages/Customers/Customers.jsx";
import Sales from "./pages/Sales/Sales.jsx";
import Payments from "./pages/Payments/Payments.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Reports from "./pages/Reports/Reports.jsx";

export default function App() {
  const [page, setPage] = useState("products");

  return (
    <div>
      <nav>
        <button onClick={() => setPage("products")}>Products</button>
        <button onClick={() => setPage("customers")}>Customers</button>
        <button onClick={() => setPage("sales")}>Sales</button>
        <button onClick={() => setPage("payments")}>Payments</button>
        <button onClick={() => setPage("dashboard")}>Dashboard</button>
        <button onClick={() => setPage("reports")}>Reports</button>
      </nav>
      {page === "products" ? (
        <Products />
      ) : page === "customers" ? (
        <Customers />
      ) : page === "sales" ? (
        <Sales />
      ) : page === "payments" ? (
        <Payments />
      )
       : page === "dashboard" ? (
        <Dashboard />
      ) : page === "reports" ? (
        <Reports />
      ) : (
        <Products />
      )}
    </div>
  );
}
