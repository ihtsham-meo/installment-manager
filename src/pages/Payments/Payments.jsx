import { useEffect, useState } from "react";
import { saleService } from "../../services/sales";
import { paymentService } from "../../services/payments";
import {
  Card,
  Button,
  Input,
  Select,
  Table,
  ErrorText,
} from "../../components/ui";

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
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Payments</h2>
      <ErrorText>{error}</ErrorText>

      <Card>
        <Table
          headers={[
            "Customer",
            "Total",
            "Paid (incl. down payment)",
            "Remaining",
            "Status",
            "",
          ]}
        >
          {sales.map((s) => (
            <tr key={s.id}>
              <td className="py-2 pr-4">{s.customer_name}</td>
              <td className="py-2 pr-4">{s.total_amount}</td>
              <td className="py-2 pr-4">
                {Number(s.down_payment) + Number(s.total_paid)}
              </td>
              <td className="py-2 pr-4">{s.remaining}</td>
              <td className="py-2 pr-4 capitalize">{s.status}</td>
              <td className="py-2 pr-4">
                <Button variant="secondary" onClick={() => openSale(s.id)}>
                  Open
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {selectedSaleId && (
        <Card className="space-y-4">
          <h3 className="font-semibold">Record Payment</h3>
          <form
            onSubmit={handleRecord}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="other">Other</option>
            </Select>
            <Input
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button type="submit">Record Payment</Button>
          </form>

          <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-300">
            History
          </h4>
          <Table
            headers={["Installment #", "Amount", "Date", "Method", "Action"]}
          >
            {history.map((h) => (
              <tr key={h.id}>
                <td className="py-2 pr-4">{h.installment_no}</td>
                <td className="py-2 pr-4">{h.amount}</td>
                <td className="py-2 pr-4">{h.payment_date}</td>
                <td className="py-2 pr-4 capitalize">{h.payment_method}</td>
                <td className="py-2 pr-4">
                  {voidingId === h.id ? (
                    <span className="space-x-2">
                      <Input
                        className="inline-block w-32"
                        placeholder="Reason"
                        value={voidReason}
                        onChange={(e) => setVoidReason(e.target.value)}
                      />
                      <Button variant="danger" onClick={confirmVoidPayment}>
                        Confirm
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setVoidingId(null)}
                      >
                        Cancel
                      </Button>
                    </span>
                  ) : (
                    <Button
                      variant="danger"
                      onClick={() => {
                        setVoidingId(h.id);
                        setVoidReason("");
                      }}
                    >
                      Void
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </div>
  );
}
