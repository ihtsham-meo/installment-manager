import { useEffect, useState } from 'react';
import { saleService } from '../../services/sales';
import { customerService } from '../../services/customers';
import { productService } from '../../services/products';
import { Card, Button, Input, Select, Table, ErrorText } from '../../components/ui';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [error, setError] = useState('');
  const [voidingSaleId, setVoidingSaleId] = useState(null);
  const [voidReason, setVoidReason] = useState('');

  const [form, setForm] = useState({
    customer_id: '', down_payment: 0, installment_count: 6,
    plan_start_date: new Date().toISOString().slice(0, 10), frequency: 'monthly',
  });
  const [items, setItems] = useState([{ product_id: '', quantity: 1, unit_price: 0 }]);

  const loadAll = async () => {
    setSales(await saleService.list());
    setCustomers(await customerService.list());
    setProducts(await productService.list());
  };
  useEffect(() => { loadAll(); }, []);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === 'product_id') {
      const p = products.find((pr) => pr.id === Number(value));
      if (p) updated[index].unit_price = p.sale_price;
    }
    setItems(updated);
  };
  const addItemRow = () => setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await saleService.create({
        customer_id: Number(form.customer_id),
        items: items.map((i) => ({ ...i, product_id: Number(i.product_id), quantity: Number(i.quantity), unit_price: Number(i.unit_price) })),
        down_payment: Number(form.down_payment),
        installment_count: Number(form.installment_count),
        plan_start_date: form.plan_start_date,
        frequency: form.frequency,
      });
      setItems([{ product_id: '', quantity: 1, unit_price: 0 }]);
      setError('');
      loadAll();
    } catch (err) { setError(err.message); }
  };

  const viewSchedule = async (saleId) => setSelectedSchedule(await saleService.getSchedule(saleId));

  const startVoid = (saleId) => { setVoidingSaleId(saleId); setVoidReason(''); };
  const confirmVoid = async () => {
    if (!voidReason.trim()) return;
    try {
      await saleService.void({ saleId: voidingSaleId, reason: voidReason });
      setVoidingSaleId(null);
      setError('');
      loadAll();
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Sales</h2>
      <Card>
        <ErrorText>{error}</ErrorText>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} required>
            <option value="">Select Customer</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </Select>

          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-3">
              <Select value={item.product_id} onChange={(e) => handleItemChange(idx, 'product_id', e.target.value)} required>
                <option value="">Select Product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
              <Input type="number" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} min="1" />
              <Input type="number" value={item.unit_price} onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)} />
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={addItemRow}>+ Add Product</Button>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input type="number" placeholder="Down Payment" value={form.down_payment} onChange={(e) => setForm({ ...form, down_payment: e.target.value })} />
            <Input type="number" placeholder="Installments" value={form.installment_count} onChange={(e) => setForm({ ...form, installment_count: e.target.value })} />
            <Input type="date" value={form.plan_start_date} onChange={(e) => setForm({ ...form, plan_start_date: e.target.value })} />
            <Select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </Select>
          </div>
          <Button type="submit">Create Sale</Button>
        </form>
      </Card>

      <Card>
        <Table headers={['Customer', 'Total', 'Installments', 'Status', 'Actions']}>
          {sales.map((s) => (
            <tr key={s.id}>
              <td className="py-2 pr-4">{s.customer_name}</td>
              <td className="py-2 pr-4">{s.total_amount}</td>
              <td className="py-2 pr-4">{s.installment_count}</td>
              <td className="py-2 pr-4 capitalize">{s.status}</td>
              <td className="py-2 pr-4 space-x-2">
                <Button variant="secondary" onClick={() => viewSchedule(s.id)}>View Schedule</Button>
                {voidingSaleId === s.id ? (
                  <>
                    <Input className="inline-block w-32" placeholder="Reason" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
                    <Button variant="danger" onClick={confirmVoid}>Confirm</Button>
                    <Button variant="secondary" onClick={() => setVoidingSaleId(null)}>Cancel</Button>
                  </>
                ) : (
                  <Button variant="danger" onClick={() => startVoid(s.id)}>Void</Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {selectedSchedule && (
        <Card>
          <h3 className="font-semibold mb-3">Schedule</h3>
          <Table headers={['#', 'Due Date', 'Amount', 'Status', 'Action']}>
            {selectedSchedule.map((row, idx) => (
              <tr key={row.id}>
                <td className="py-2 pr-4">{row.installment_no}</td>
                <td className="py-2 pr-4">
                  <Input type="date" value={row.due_date} onChange={(e) => {
                    const updated = [...selectedSchedule]; updated[idx].due_date = e.target.value; setSelectedSchedule(updated);
                  }} />
                </td>
                <td className="py-2 pr-4">
                  <Input type="number" value={row.due_amount} onChange={(e) => {
                    const updated = [...selectedSchedule]; updated[idx].due_amount = e.target.value; setSelectedSchedule(updated);
                  }} />
                </td>
                <td className="py-2 pr-4 capitalize">{row.status}</td>
                <td className="py-2 pr-4">
                  <Button variant="secondary" onClick={() => saleService.updateScheduleRow({ scheduleId: row.id, due_date: row.due_date, due_amount: row.due_amount })}>Save</Button>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </div>
  );
}