import { useEffect, useState } from "react";
import { customerService } from "../../services/customers";
import {
  sanitizeName,
  sanitizePhone,
  formatCnic,
} from "../../utils/validation";
import { Card, Button, Input, Table, ErrorText } from "../../components/ui";

const emptyCustomer = {
  full_name: "",
  cnic: "",
  phone: "",
  address: "",
  photo_path: "",
  doc_path: "",
};
const emptyGuarantor = { name: "", cnic: "", phone: "", doc_path: "" };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyCustomer);
  const [guarantors, setGuarantors] = useState([{ ...emptyGuarantor }]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const loadCustomers = async () => setCustomers(await customerService.list());
  useEffect(() => {
    loadCustomers();
  }, []);

  const handleNameChange = (e) =>
    setForm({ ...form, full_name: sanitizeName(e.target.value) });
  const handlePhoneChange = (e) =>
    setForm({ ...form, phone: sanitizePhone(e.target.value) });
  const handleCnicChange = (e) =>
    setForm({ ...form, cnic: formatCnic(e.target.value) });
  const handleAddressChange = (e) =>
    setForm({ ...form, address: e.target.value });

  const handleCnicBlur = async () => {
    if (!form.cnic || editingId) return;
    const existing = await customerService.checkCnic(form.cnic);
    setError(existing ? `CNIC already used by ${existing.full_name}` : "");
  };

  const handleSelectPhoto = async () => {
    const p = await customerService.selectFile();
    if (p) setForm({ ...form, photo_path: p });
  };
  const handleSelectDoc = async () => {
    const p = await customerService.selectFile();
    if (p) setForm({ ...form, doc_path: p });
  };

  const updateGuarantor = (idx, field, value) => {
    const updated = [...guarantors];
    if (field === "name") value = sanitizeName(value);
    if (field === "phone") value = sanitizePhone(value);
    if (field === "cnic") value = formatCnic(value);
    updated[idx][field] = value;
    setGuarantors(updated);
  };
  const addGuarantorRow = () =>
    setGuarantors([...guarantors, { ...emptyGuarantor }]);
  const removeGuarantorRow = (idx) =>
    setGuarantors(guarantors.filter((_, i) => i !== idx));
  const selectGuarantorDoc = async (idx) => {
    const p = await customerService.selectFile();
    if (p) updateGuarantor(idx, "doc_path", p);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        customer: form,
        guarantors: guarantors.filter((g) => g.name.trim()),
      };
      if (editingId)
        await customerService.update({ id: editingId, ...payload });
      else await customerService.add(payload);
      setForm(emptyCustomer);
      setGuarantors([{ ...emptyGuarantor }]);
      setEditingId(null);
      setError("");
      loadCustomers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = async (c) => {
    setForm(c);
    setEditingId(c.id);
    const gs = await customerService.getGuarantors(c.id);
    setGuarantors(gs.length ? gs : [{ ...emptyGuarantor }]);
  };
  const handleDelete = async (id) => {
    await customerService.delete(id);
    loadCustomers();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Customers</h2>
      <Card>
        <ErrorText>{error}</ErrorText>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input
              placeholder="Full Name"
              value={form.full_name}
              onChange={handleNameChange}
              required
            />
            <Input
              placeholder="CNIC (12345-1234567-1)"
              value={form.cnic}
              onChange={handleCnicChange}
              onBlur={handleCnicBlur}
              maxLength={15}
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={handlePhoneChange}
            />
            <Input
              placeholder="Address"
              value={form.address}
              onChange={handleAddressChange}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleSelectPhoto}
            >
              Select Photo
            </Button>
            <Button type="button" variant="secondary" onClick={handleSelectDoc}>
              Select CNIC/Doc
            </Button>
          </div>

          <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-300">
            Guarantors
          </h4>
          {guarantors.map((g, idx) => (
            <div
              key={idx}
              className="grid grid-cols-2 md:grid-cols-5 gap-3 items-center"
            >
              <Input
                placeholder="Guarantor Name"
                value={g.name}
                onChange={(e) => updateGuarantor(idx, "name", e.target.value)}
              />
              <Input
                placeholder="Guarantor CNIC"
                value={g.cnic}
                onChange={(e) => updateGuarantor(idx, "cnic", e.target.value)}
                maxLength={15}
              />
              <Input
                placeholder="Guarantor Phone"
                value={g.phone}
                onChange={(e) => updateGuarantor(idx, "phone", e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => selectGuarantorDoc(idx)}
              >
                Select Doc
              </Button>
              {guarantors.length > 1 && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => removeGuarantorRow(idx)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={addGuarantorRow}>
            + Add Another Guarantor
          </Button>

          <div>
            <Button type="submit">
              {editingId ? "Update" : "Add"} Customer
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <Table headers={["Name", "CNIC", "Phone", "Actions"]}>
          {customers.map((c) => (
            <tr key={c.id}>
              <td className="py-2 pr-4">{c.full_name}</td>
              <td className="py-2 pr-4">{c.cnic}</td>
              <td className="py-2 pr-4">{c.phone}</td>
              <td className="py-2 pr-4 space-x-2">
                <Button variant="secondary" onClick={() => handleEdit(c)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => handleDelete(c.id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
