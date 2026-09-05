const { ipcMain, BrowserWindow } = require("electron");
const pool = require("../db");
const { requireRole } = require("../session");
const { logAudit } = require("../audit");

function registerSettingsHandlers() {
  ipcMain.handle("settings:get", async () => {
    const [rows] = await pool.query(
      "SELECT setting_key, setting_value FROM settings",
    );
    const settings = {};
    rows.forEach((r) => {
      settings[r.setting_key] = r.setting_value;
    });
    return settings;
  });

  ipcMain.handle("settings:update", async (event, { key, value }) => {
    requireRole("admin");
    await pool.query(
      `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [key, value],
    );
    if (key === "business_name") {
      BrowserWindow.getAllWindows().forEach((w) => w.setTitle(value));
    }
    await logAudit("update", "settings", null, null, { key, value });
    return { key, value };
  });
}

module.exports = registerSettingsHandlers;
