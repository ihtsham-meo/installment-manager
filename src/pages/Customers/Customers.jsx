import { useEffect, useState } from "react";
import { customerService } from "../../services/customers";
import {
  sanitizeName,
  sanitizePhone,
  formatCnic,
} from "../../utils/validation";

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
      if (editingId) {
        await customerService.update({ id: editingId, ...payload });
      } else {
        await customerService.add(payload);
      }
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
    <div>
      <h2>Customers</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Full Name"
          value={form.full_name}
          onChange={handleNameChange}
          required
        />
        <input
          placeholder="CNIC (12345-1234567-1)"
          value={form.cnic}
          onChange={handleCnicChange}
          onBlur={handleCnicBlur}
          maxLength={15}
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={handlePhoneChange}
        />
        <input
          placeholder="Address"
          value={form.address}
          onChange={handleAddressChange}
        />
        <button type="button" onClick={handleSelectPhoto}>
          Select Photo
        </button>
        <button type="button" onClick={handleSelectDoc}>
          Select CNIC/Doc
        </button>

        <h4>Guarantors</h4>
        {guarantors.map((g, idx) => (
          <div key={idx}>
            <input
              placeholder="Guarantor Name"
              value={g.name}
              onChange={(e) => updateGuarantor(idx, "name", e.target.value)}
            />
            <input
              placeholder="Guarantor CNIC"
              value={g.cnic}
              onChange={(e) => updateGuarantor(idx, "cnic", e.target.value)}
              maxLength={15}
            />
            <input
              placeholder="Guarantor Phone"
              value={g.phone}
              onChange={(e) => updateGuarantor(idx, "phone", e.target.value)}
            />
            <button type="button" onClick={() => selectGuarantorDoc(idx)}>
              Select Doc
            </button>
            {guarantors.length > 1 && (
              <button type="button" onClick={() => removeGuarantorRow(idx)}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addGuarantorRow}>
          + Add Another Guarantor
        </button>

        <button type="submit">{editingId ? "Update" : "Add"} Customer</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>CNIC</th>
            <th>Phone</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td>{c.full_name}</td>
              <td>{c.cnic}</td>
              <td>{c.phone}</td>
              <td>
                <button onClick={() => handleEdit(c)}>Edit</button>
                <button onClick={() => handleDelete(c.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
