// src/pages/Auth/Setup.jsx
import { useState } from "react";
import { authService } from "../../services/auth";
import { Card, Button, Input, ErrorText } from "../../components/ui";

export default function Setup({ onDone, businessName }) {
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
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900">
      <Card className="w-96">
        <h2 className="text-lg font-bold mb-1 text-brand">
          {businessName}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          First-time setup: create the admin account
        </p>
        <ErrorText>{error}</ErrorText>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Full Name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
          <Input
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Button type="submit" className="w-full">
            Create Admin
          </Button>
        </form>
      </Card>
    </div>
  );
}
