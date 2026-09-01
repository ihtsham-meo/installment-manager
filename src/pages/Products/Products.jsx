import { useEffect, useState } from "react";
import { productService } from "../../services/products";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    barcode: "",
    cost_price: "",
    sale_price: "",
    stock_quantity: "",
    unit: "pcs",
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const loadProducts = async () => setProducts(await productService.list());

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await productService.update(editingId, form);
    } else {
      await productService.add(form);
    }
    setForm({
      name: "",
      category: "",
      barcode: "",
      cost_price: "",
      sale_price: "",
      stock_quantity: "",
      unit: "pcs",
    });
    setEditingId(null);
    loadProducts();
  };

  const handleEdit = (p) => {
    setForm(p);
    setEditingId(p.id);
  };
  const handleDelete = async (id) => {
    try {
      await productService.delete(id);
      setError("");
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Products</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          name="company"
          placeholder="Company"
          value={form.company}
          onChange={handleChange}
        />
        <input
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
        />
        <input
          name="barcode"
          placeholder="Barcode"
          value={form.barcode}
          onChange={handleChange}
        />
        <input
          name="cost_price"
          type="number"
          placeholder="Cost Price"
          value={form.cost_price}
          onChange={handleChange}
          required
        />
        <input
          name="sale_price"
          type="number"
          placeholder="Sale Price"
          value={form.sale_price}
          onChange={handleChange}
          required
        />
        <input
          name="stock_quantity"
          type="number"
          placeholder="Stock"
          value={form.stock_quantity}
          onChange={handleChange}
          required
        />
        <button type="submit">{editingId ? "Update" : "Add"} Product</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Cost</th>
            <th>Sale Price</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.category}</td>
              <td>{p.cost_price}</td>
              <td>{p.sale_price}</td>
              <td>{p.stock_quantity}</td>
              <td>
                <button onClick={() => handleEdit(p)}>Edit</button>
                <button onClick={() => handleDelete(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
