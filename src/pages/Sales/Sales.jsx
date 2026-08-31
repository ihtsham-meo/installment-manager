import { useEffect, useState } from "react";
import { saleService } from "../../services/sales";
import { customerService } from "../../services/customers";
import { productService } from "../../services/products";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const [form, setForm] = useState({
    customer_id: "",
    down_payment: 0,
    installment_count: 6,
    plan_start_date: new Date().toISOString().slice(0, 10),
    frequency: "monthly",
  });
  const [items, setItems] = useState([
    { product_id: "", quantity: 1, unit_price: 0 },
  ]);
  const [voidingSaleId, setVoidingSaleId] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const [error, setError] = useState("");

  const loadAll = async () => {
    setSales(await saleService.list());
    setCustomers(await customerService.list());
    setProducts(await productService.list());
  };
  useEffect(() => {
    loadAll();
  }, []);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === "product_id") {
      const p = products.find((pr) => pr.id === Number(value));
      if (p) updated[index].unit_price = p.sale_price;
    }
    setItems(updated);
  };

  const addItemRow = () =>
    setItems([...items, { product_id: "", quantity: 1, unit_price: 0 }]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await saleService.create({
        customer_id: Number(form.customer_id),
        items: items.map((i) => ({
          ...i,
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
        })),
        down_payment: Number(form.down_payment),
        installment_count: Number(form.installment_count),
        plan_start_date: form.plan_start_date,
        frequency: form.frequency,
      });
      setItems([{ product_id: "", quantity: 1, unit_price: 0 }]);
      setError("");
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const viewSchedule = async (saleId) =>
    setSelectedSchedule(await saleService.getSchedule(saleId));

  const startVoid = (saleId) => {
    setVoidingSaleId(saleId);
    setVoidReason("");
  };

  const confirmVoid = async () => {
    if (!voidReason || voidingSaleId === null) return;
    await saleService.void({ saleId: voidingSaleId, reason: voidReason });
    setVoidingSaleId(null);
    setVoidReason("");
    loadAll();
  };

  return (
    <div>
      <h2>Sales</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <select
          value={form.customer_id}
          onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
          required
        >
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </select>

        {items.map((item, idx) => (
          <div key={idx}>
            <select
              value={item.product_id}
              onChange={(e) =>
                handleItemChange(idx, "product_id", e.target.value)
              }
              required
            >
              <option value="">Select Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) =>
                handleItemChange(idx, "quantity", e.target.value)
              }
              min="1"
            />
            <input
              type="number"
              value={item.unit_price}
              onChange={(e) =>
                handleItemChange(idx, "unit_price", e.target.value)
              }
            />
          </div>
        ))}
        <button type="button" onClick={addItemRow}>
          + Add Product
        </button>

        <input
          type="number"
          placeholder="Down Payment"
          value={form.down_payment}
          onChange={(e) => setForm({ ...form, down_payment: e.target.value })}
        />
        <input
          type="number"
          placeholder="Installments"
          value={form.installment_count}
          onChange={(e) =>
            setForm({ ...form, installment_count: e.target.value })
          }
        />
        <input
          type="date"
          value={form.plan_start_date}
          onChange={(e) =>
            setForm({ ...form, plan_start_date: e.target.value })
          }
        />
        <select
          value={form.frequency}
          onChange={(e) => setForm({ ...form, frequency: e.target.value })}
        >
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
        </select>
        <button type="submit">Create Sale</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Total</th>
            <th>Installments</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id}>
              <td>{s.customer_name}</td>
              <td>{s.total_amount}</td>
              <td>{s.installment_count}</td>
              <td>{s.status}</td>
              <td>
                <button onClick={() => viewSchedule(s.id)}>
                  View Schedule
                </button>
                {voidingSaleId === s.id ? (
                  <>
                    <input
                      placeholder="Reason"
                      value={voidReason}
                      onChange={(e) => setVoidReason(e.target.value)}
                    />
                    <button onClick={confirmVoid}>Confirm Void</button>
                    <button onClick={() => setVoidingSaleId(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => startVoid(s.id)}>Void</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedSchedule && (
        <div>
          <h3>Schedule</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {selectedSchedule.map((row) => (
                <tr key={row.id}>
                  <td>{row.installment_no}</td>
                  <td>{row.due_date}</td>
                  <td>{row.due_amount}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
