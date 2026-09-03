import { useEffect, useState } from "react";
import { userService } from "../../services/users";
import { auditService } from "../../services/audit";
import {
  Card,
  Button,
  Input,
  Select,
  Table,
  ErrorText,
} from "../../components/ui";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [form, setForm] = useState({
    username: "",
    password: "",
    full_name: "",
    role: "cashier",
  });
  const [error, setError] = useState("");
  const [resettingId, setResettingId] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const loadUsers = async () => setUsers(await userService.list());
  const loadAudit = async () => setAuditLog(await auditService.list());
  useEffect(() => {
    loadUsers();
    loadAudit();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await userService.add(form);
      setForm({ username: "", password: "", full_name: "", role: "cashier" });
      setError("");
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActive = async (u) => {
    await userService.update({
      id: u.id,
      full_name: u.full_name,
      role: u.role,
      active: !u.active,
    });
    loadUsers();
  };
  const confirmReset = async () => {
    if (!newPassword) return;
    await userService.resetPassword({ id: resettingId, newPassword });
    setResettingId(null);
    setNewPassword("");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Users</h2>
      <Card>
        <ErrorText>{error}</ErrorText>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 md:grid-cols-5 gap-3"
        >
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
          <Select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="cashier">Cashier</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </Select>
          <Button type="submit">Add User</Button>
        </form>
      </Card>

      <Card>
        <Table headers={["Name", "Username", "Role", "Active", "Actions"]}>
          {users.map((u) => (
            <tr key={u.id}>
              <td className="py-2 pr-4">{u.full_name}</td>
              <td className="py-2 pr-4">{u.username}</td>
              <td className="py-2 pr-4 capitalize">{u.role}</td>
              <td className="py-2 pr-4">{u.active ? "Yes" : "No"}</td>
              <td className="py-2 pr-4 space-x-2">
                <Button variant="secondary" onClick={() => toggleActive(u)}>
                  {u.active ? "Deactivate" : "Activate"}
                </Button>
                {resettingId === u.id ? (
                  <span className="space-x-2">
                    <Input
                      className="inline-block w-32"
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Button onClick={confirmReset}>Save</Button>
                    <Button
                      variant="secondary"
                      onClick={() => setResettingId(null)}
                    >
                      Cancel
                    </Button>
                  </span>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setResettingId(u.id);
                      setNewPassword("");
                    }}
                  >
                    Reset Password
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card>
        <h3 className="font-semibold mb-3">Audit Log (latest 200)</h3>
        <Table headers={["User", "Action", "Table", "Record", "Time"]}>
          {auditLog.map((a) => (
            <tr key={a.id}>
              <td className="py-2 pr-4">{a.username}</td>
              <td className="py-2 pr-4 capitalize">{a.action}</td>
              <td className="py-2 pr-4">{a.table_name}</td>
              <td className="py-2 pr-4">{a.record_id}</td>
              <td className="py-2 pr-4">{a.timestamp}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
