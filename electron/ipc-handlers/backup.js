const { ipcMain, dialog } = require("electron");
const pool = require("../db");
const backupManager = require("../backup-manager");
const { requireRole } = require('../session');
const { logAudit } = require('../audit');

function registerBackupHandlers() {
  ipcMain.handle("backup:create", async (event, { passphrase }) => {
    requireRole("admin");
    const result = await dialog.showSaveDialog({
      defaultPath: `installment-backup-${Date.now()}.backup`,
      filters: [{ name: "Encrypted Backup", extensions: ["backup"] }],
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    const backupResult = await backupManager.createBackup(
      result.filePath,
      passphrase,
      "local",
    );
    await logAudit("backup", "backups", null, null, { path: result.filePath });
    return backupResult;
  });

  ipcMain.handle("backup:restore", async (event, { passphrase }) => {
    requireRole("admin");
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Encrypted Backup", extensions: ["backup"] }],
    });
    if (result.canceled || result.filePaths.length === 0)
      return { canceled: true };
    const restoreResult = await backupManager.restoreBackup(
      result.filePaths[0],
      passphrase,
    );
    await logAudit("restore", "backups", null, null, {
      path: result.filePaths[0],
    });
    return restoreResult;
  });

  ipcMain.handle("backup:list", async () => {
    const [rows] = await pool.query(
      "SELECT * FROM backups ORDER BY created_at DESC LIMIT 50",
    );
    return rows;
  });
}

module.exports = registerBackupHandlers;
