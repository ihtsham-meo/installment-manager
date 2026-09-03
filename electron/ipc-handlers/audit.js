const { ipcMain } = require("electron");
const pool = require("../db");
const { requireRole } = require("../session");

function registerAuditHandlers() {
  ipcMain.handle("audit:list", async (event, { limit = 200 } = {}) => {
    requireRole("admin", "manager");
    const [rows] = await pool.query(
      `SELECT a.*, u.username FROM audit_log a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.timestamp DESC LIMIT ?`,
      [limit],
    );
    return rows;
  });
}

module.exports = registerAuditHandlers;
