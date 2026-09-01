import { useState } from "react";
import Products from "./pages/Products/Products.jsx";
import Customers from "./pages/Customers/Customers.jsx";
import Sales from "./pages/Sales/Sales.jsx";
import Payments from "./pages/Payments/Payments.jsx";
// add a 'payments' nav button and case, same pattern as the others

export default function App() {
  const [page, setPage] = useState("products");

  return (
    <div>
      <nav>
        <button onClick={() => setPage("products")}>Products</button>
        <button onClick={() => setPage("customers")}>Customers</button>
        <button onClick={() => setPage("sales")}>Sales</button>
        <button onClick={() => setPage("payments")}>Payments</button>
      </nav>
      {page === "products" ? (
        <Products />
      ) : page === "customers" ? (
        <Customers />
      ) : page === "sales" ? (
        <Sales />
      ) : (
        <Payments />
      )}
    </div>
  );
}
