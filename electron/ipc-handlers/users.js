const { ipcMain } = require("electron");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const { setCurrentUser, getCurrentUser, requireRole } = require("../session");

function registerUserHandlers() {
  ipcMain.handle("users:needsSetup", async () => {
    const [rows] = await pool.query("SELECT COUNT(*) AS cnt FROM users");
    return rows[0].cnt === 0;
  });

  ipcMain.handle(
    "users:createFirstAdmin",
    async (event, { username, password, full_name }) => {
      const [rows] = await pool.query("SELECT COUNT(*) AS cnt FROM users");
      if (rows[0].cnt > 0) throw new Error("Setup already completed");
      const password_hash = await bcrypt.hash(password, 10);
      const [result] = await pool.query(
        `INSERT INTO users (username, password_hash, full_name, role, active) VALUES (?, ?, ?, 'admin', 1)`,
        [username, password_hash, full_name],
      );
      return { id: result.insertId, username, role: "admin" };
    },
  );

  ipcMain.handle("users:login", async (event, { username, password }) => {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ? AND active = 1",
      [username],
    );
    const user = rows[0];
    if (!user) throw new Error("Invalid username or password");
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw new Error("Invalid username or password");
    const safeUser = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    };
    setCurrentUser(safeUser);
    return safeUser;
  });

  ipcMain.handle("users:logout", async () => {
    setCurrentUser(null);
    return { loggedOut: true };
  });
  ipcMain.handle("users:current", async () => getCurrentUser());

  ipcMain.handle("users:list", async () => {
    requireRole("admin");
    const [rows] = await pool.query(
      "SELECT id, username, full_name, role, active, created_at FROM users ORDER BY created_at DESC",
    );
    return rows;
  });

  ipcMain.handle(
    "users:add",
    async (event, { username, password, full_name, role }) => {
      requireRole("admin");
      const password_hash = await bcrypt.hash(password, 10);
      const [result] = await pool.query(
        `INSERT INTO users (username, password_hash, full_name, role, active) VALUES (?, ?, ?, ?, 1)`,
        [username, password_hash, full_name, role],
      );
      return { id: result.insertId, username, full_name, role };
    },
  );

  ipcMain.handle(
    "users:update",
    async (event, { id, full_name, role, active }) => {
      requireRole("admin");
      await pool.query(
        "UPDATE users SET full_name=?, role=?, active=? WHERE id=?",
        [full_name, role, active ? 1 : 0, id],
      );
      return { id, full_name, role, active };
    },
  );

  ipcMain.handle("users:resetPassword", async (event, { id, newPassword }) => {
    requireRole("admin");
    const password_hash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash=? WHERE id=?", [
      password_hash,
      id,
    ]);
    return { id };
  });

  ipcMain.handle(
    "users:changeOwnPassword",
    async (event, { oldPassword, newPassword }) => {
      const current = getCurrentUser();
      if (!current) throw new Error("Not logged in");
      const [rows] = await pool.query("SELECT * FROM users WHERE id=?", [
        current.id,
      ]);
      const match = await bcrypt.compare(oldPassword, rows[0].password_hash);
      if (!match) throw new Error("Current password is incorrect");
      const password_hash = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET password_hash=? WHERE id=?", [
        password_hash,
        current.id,
      ]);
      return { changed: true };
    },
  );
}

module.exports = registerUserHandlers;
