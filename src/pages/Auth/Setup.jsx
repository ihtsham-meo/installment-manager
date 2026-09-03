import { useState } from "react";
import { authService } from "../../services/auth";

export default function Setup({ onDone }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    full_name: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authService.createFirstAdmin(form);
      onDone();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>First-Time Setup: Create Admin Account</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Full Name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          required
        />
        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button type="submit">Create Admin</button>
      </form>
    </div>
  );
}
