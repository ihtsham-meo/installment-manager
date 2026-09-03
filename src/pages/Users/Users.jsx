import { useEffect, useState } from "react";
import { userService } from "../../services/users";
import { auditService } from "../../services/audit";

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
    <div>
      <h2>Users</h2>
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
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="cashier">Cashier</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Add User</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Role</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.full_name}</td>
              <td>{u.username}</td>
              <td>{u.role}</td>
              <td>{u.active ? "Yes" : "No"}</td>
              <td>
                <button onClick={() => toggleActive(u)}>
                  {u.active ? "Deactivate" : "Activate"}
                </button>
                {resettingId === u.id ? (
                  <>
                    <input
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button onClick={confirmReset}>Save</button>
                    <button onClick={() => setResettingId(null)}>Cancel</button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setResettingId(u.id);
                      setNewPassword("");
                    }}
                  >
                    Reset Password
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Audit Log (latest 200)</h3>
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Action</th>
            <th>Table</th>
            <th>Record</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {auditLog.map((a) => (
            <tr key={a.id}>
              <td>{a.username}</td>
              <td>{a.action}</td>
              <td>{a.table_name}</td>
              <td>{a.record_id}</td>
              <td>{a.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
