import { useEffect, useState } from "react";
import { productService } from "../../services/products";
import { Card, Button, Input, Table, ErrorText } from "../../components/ui";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    company: "",
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
    try {
      if (editingId) await productService.update(editingId, form);
      else await productService.add(form);
      setForm({
        name: "",
        company: "",
        category: "",
        barcode: "",
        cost_price: "",
        sale_price: "",
        stock_quantity: "",
        unit: "pcs",
      });
      setEditingId(null);
      setError("");
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (p) => {
    setForm(p);
    setEditingId(p.id);
  };
  const handleDelete = async (id) => {
    try {
      await productService.delete(id);
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Products</h2>
      <Card>
        <ErrorText>{error}</ErrorText>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <Input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <Input
            name="company"
            placeholder="Company"
            value={form.company}
            onChange={handleChange}
          />
          <Input
            name="category"
            placeholder="Category"
            value={form.category}
            onChange={handleChange}
          />
          <Input
            name="barcode"
            placeholder="Barcode"
            value={form.barcode}
            onChange={handleChange}
          />
          <Input
            name="cost_price"
            type="number"
            placeholder="Cost Price"
            value={form.cost_price}
            onChange={handleChange}
            required
          />
          <Input
            name="sale_price"
            type="number"
            placeholder="Sale Price"
            value={form.sale_price}
            onChange={handleChange}
            required
          />
          <Input
            name="stock_quantity"
            type="number"
            placeholder="Stock"
            value={form.stock_quantity}
            onChange={handleChange}
            required
          />
          <Button type="submit">{editingId ? "Update" : "Add"} Product</Button>
        </form>
      </Card>

      <Card>
        <Table
          headers={[
            "Name",
            "Company",
            "Category",
            "Cost",
            "Sale Price",
            "Stock",
            "Actions",
          ]}
        >
          {products.map((p) => (
            <tr key={p.id}>
              <td className="py-2 pr-4">{p.name}</td>
              <td className="py-2 pr-4">{p.company}</td>
              <td className="py-2 pr-4">{p.category}</td>
              <td className="py-2 pr-4">{p.cost_price}</td>
              <td className="py-2 pr-4">{p.sale_price}</td>
              <td className="py-2 pr-4">{p.stock_quantity}</td>
              <td className="py-2 pr-4 space-x-2">
                <Button variant="secondary" onClick={() => handleEdit(p)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => handleDelete(p.id)}>
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
