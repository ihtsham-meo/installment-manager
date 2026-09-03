// src/pages/Auth/Login.jsx
import { useState } from "react";
import { authService } from "../../services/auth";
import { Card, Button, Input, ErrorText } from "../../components/ui";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      onLogin(await authService.login({ username, password }));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900">
      <Card className="w-80">
        <h2 className="text-lg font-bold mb-4 text-brand">
          Installment Manager
        </h2>
        <ErrorText>{error}</ErrorText>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </Card>
    </div>
  );
}
