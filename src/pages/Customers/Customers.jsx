import { useEffect, useState } from "react";
import { customerService } from "../../services/customers";

const emptyForm = {
  full_name: "",
  cnic: "",
  phone: "",
  address: "",
  guarantor_name: "",
  guarantor_cnic: "",
  guarantor_phone: "",
  photo_path: "",
  doc_path: "",
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const loadCustomers = async () => setCustomers(await customerService.list());
  useEffect(() => {
    loadCustomers();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCnicBlur = async () => {
    if (!form.cnic || editingId) return;
    const existing = await customerService.checkCnic(form.cnic);
    setError(existing ? `CNIC already used by ${existing.full_name}` : "");
  };

  const handleSelectPhoto = async () => {
    const path = await customerService.selectFile();
    if (path) setForm({ ...form, photo_path: path });
  };

  const handleSelectDoc = async () => {
    const path = await customerService.selectFile();
    if (path) setForm({ ...form, doc_path: path });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await customerService.update(editingId, form);
      } else {
        await customerService.add(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      setError("");
      loadCustomers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (c) => {
    setForm(c);
    setEditingId(c.id);
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
          name="full_name"
          placeholder="Full Name"
          value={form.full_name}
          onChange={handleChange}
          required
        />
        <input
          name="cnic"
          placeholder="CNIC"
          value={form.cnic}
          onChange={handleChange}
          onBlur={handleCnicBlur}
        />
        <input
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
        />
        <input
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
        />
        <input
          name="guarantor_name"
          placeholder="Guarantor Name"
          value={form.guarantor_name}
          onChange={handleChange}
        />
        <input
          name="guarantor_cnic"
          placeholder="Guarantor CNIC"
          value={form.guarantor_cnic}
          onChange={handleChange}
        />
        <input
          name="guarantor_phone"
          placeholder="Guarantor Phone"
          value={form.guarantor_phone}
          onChange={handleChange}
        />
        <button type="button" onClick={handleSelectPhoto}>
          Select Photo
        </button>
        <button type="button" onClick={handleSelectDoc}>
          Select CNIC/Doc
        </button>
        <button type="submit">{editingId ? "Update" : "Add"} Customer</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>CNIC</th>
            <th>Phone</th>
            <th>Guarantor</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td>{c.full_name}</td>
              <td>{c.cnic}</td>
              <td>{c.phone}</td>
              <td>{c.guarantor_name}</td>
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
