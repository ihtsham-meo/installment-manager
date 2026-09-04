const { generateLicenseKey } = require("../electron/utils/licenseKeys");

const machineId = process.argv[2];
const expiresAt = process.argv[3] || "never"; // e.g. "2027-12-31"

if (!machineId) {
  console.log("Usage: node scripts/generate-license.js <machineId> [expiresAt]");
  process.exit(1);
}

console.log(generateLicenseKey(machineId, expiresAt));
