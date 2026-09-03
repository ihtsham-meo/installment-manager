import { useEffect, useState } from "react";
import { saleService } from "../../services/sales";
import { paymentService } from "../../services/payments";

export default function Payments() {
  const [sales, setSales] = useState([]);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [history, setHistory] = useState([]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [voidingId, setVoidingId] = useState(null);
  const [voidReason, setVoidReason] = useState("");

  const loadSales = async () => {
    await paymentService.refreshOverdue();
    setSales(await saleService.summary());
  };
  useEffect(() => {
    loadSales();
  }, []);

  const openSale = async (saleId) => {
    setSelectedSaleId(saleId);
    setHistory(await paymentService.listForSale(saleId));
  };

  const handleRecord = async (e) => {
    e.preventDefault();
    try {
      const result = await paymentService.record({
        saleId: selectedSaleId,
        amount: Number(amount),
        payment_method: method,
        notes,
      });
      setAmount("");
      setNotes("");
      setError("");
      if (result.unallocated > 0)
        setError(
          `${result.unallocated} could not be allocated — all installments already paid.`,
        );
      loadSales();
      openSale(selectedSaleId);
    } catch (err) {
      setError(err.message);
    }
  };

  const confirmVoidPayment = async () => {
    if (!voidReason.trim()) return;
    try {
      await paymentService.void({ paymentId: voidingId, reason: voidReason });
      setVoidingId(null);
      setError("");
      loadSales();
      openSale(selectedSaleId);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Payments</h2>
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Total</th>
            <th>Paid (incl. down payment)</th>
            <th>Remaining</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id}>
              <td>{s.customer_name}</td>
              <td>{s.total_amount}</td>
              <td>{Number(s.down_payment) + Number(s.total_paid)}</td>
              <td>{s.remaining}</td>
              <td>{s.status}</td>
              <td>
                <button onClick={() => openSale(s.id)}>Open</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedSaleId && (
        <div>
          <h3>Record Payment</h3>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <form onSubmit={handleRecord}>
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
            <input
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button type="submit">Record Payment</button>
          </form>

          <h4>History</h4>
          <table>
            <thead>
              <tr>
                <th>Installment #</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Method</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>{h.installment_no}</td>
                  <td>{h.amount}</td>
                  <td>{h.payment_date}</td>
                  <td>{h.payment_method}</td>
                  <td>
                    {voidingId === h.id ? (
                      <>
                        <input
                          placeholder="Reason"
                          value={voidReason}
                          onChange={(e) => setVoidReason(e.target.value)}
                        />
                        <button onClick={confirmVoidPayment}>Confirm</button>
                        <button onClick={() => setVoidingId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setVoidingId(h.id);
                          setVoidReason("");
                        }}
                      >
                        Void
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
