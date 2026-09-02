const { ipcMain, dialog } = require("electron");
const pool = require("../db");
const backupManager = require("../backup-manager");

function registerBackupHandlers() {
  ipcMain.handle("backup:create", async (event, { passphrase }) => {
    const result = await dialog.showSaveDialog({
      defaultPath: `installment-backup-${Date.now()}.backup`,
      filters: [{ name: "Encrypted Backup", extensions: ["backup"] }],
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    return backupManager.createBackup(result.filePath, passphrase, "local");
  });

  ipcMain.handle("backup:restore", async (event, { passphrase }) => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Encrypted Backup", extensions: ["backup"] }],
    });
    if (result.canceled || result.filePaths.length === 0)
      return { canceled: true };
    return backupManager.restoreBackup(result.filePaths[0], passphrase);
  });

  ipcMain.handle("backup:list", async () => {
    const [rows] = await pool.query(
      "SELECT * FROM backups ORDER BY created_at DESC LIMIT 50",
    );
    return rows;
  });
}

module.exports = registerBackupHandlers;
