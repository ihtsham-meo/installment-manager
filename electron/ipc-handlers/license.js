const { ipcMain } = require("electron");
const pool = require("../db");
const { getMachineId } = require("../utils/machineId");
const { verifyLicenseKey } = require("../utils/licenseKeys");
const { logAudit } = require("../audit");

function registerLicenseHandlers() {
  ipcMain.handle("license:status", async () => {
    const machineId = getMachineId();
    const [rows] = await pool.query(
      "SELECT * FROM licenses ORDER BY id DESC LIMIT 1",
    );
    const license = rows[0];
    if (!license) return { activated: false, machineId };

    const result = verifyLicenseKey(license.license_key, machineId);
    if (!result.valid)
      return { activated: false, machineId, reason: result.reason };
    return { activated: true, machineId, expiresAt: license.expires_at };
  });

  ipcMain.handle("license:activate", async (event, { licenseKey }) => {
    const machineId = getMachineId();
    const result = verifyLicenseKey(licenseKey, machineId);
    if (!result.valid) throw new Error(result.reason);

    const payload = Buffer.from(licenseKey.split(".")[0], "base64url").toString(
      "utf8",
    );
    const [, expiresAt] = payload.split("|");

    await pool.query(
      `INSERT INTO licenses (license_key, machine_id, activated_at, expires_at, status) VALUES (?, ?, NOW(), ?, 'active')`,
      [licenseKey, machineId, expiresAt === "never" ? null : expiresAt],
    );
    await logAudit("activate", "licenses", null, null, { machineId });
    return { activated: true };
  });
}

module.exports = registerLicenseHandlers;
