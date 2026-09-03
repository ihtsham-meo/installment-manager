const pool = require("./db");
const { getCurrentUser } = require("./session");

async function logAudit(action, tableName, recordId, oldValue, newValue) {
  const user = getCurrentUser();
  await pool.query(
    `INSERT INTO audit_log (user_id, action, table_name, record_id, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      user ? user.id : null,
      action,
      tableName,
      recordId,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
    ],
  );
}

module.exports = { logAudit };
