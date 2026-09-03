const { app, BrowserWindow } = require("electron");
const path = require("path");
const mysqlManager = require("./mysql-manager");
const registerProductHandlers = require("./ipc-handlers/products");
const registerCustomerHandlers = require("./ipc-handlers/customers");
const registerSalesHandlers = require("./ipc-handlers/sales");
const registerPaymentHandlers = require("./ipc-handlers/payments");
const { applyLateFees } = require("./utils/lateFees");
const registerReportHandlers = require("./ipc-handlers/reports");
const registerBackupHandlers = require("./ipc-handlers/backup");
const backupManager = require("./backup-manager");
const registerUserHandlers = require("./ipc-handlers/users");
const registerAuditHandlers = require("./ipc-handlers/audit");
// inside app.whenReady(), alongside the other registerXHandlers():

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(async () => {
  try {
    await mysqlManager.initAndStart();
  } catch (err) {
    console.error("Failed to start MySQL:", err);
    app.quit();
    return;
  }
  registerProductHandlers();
  registerCustomerHandlers();
  registerSalesHandlers();
  registerPaymentHandlers();
  await applyLateFees();
  registerReportHandlers();
  registerBackupHandlers();
  backupManager
    .runScheduledBackupIfDue("default-backup-passphrase-change-me")
    .catch(console.error);
  registerUserHandlers();
  registerAuditHandlers();
  createWindow();
});

app.on("window-all-closed", () => {
  mysqlManager.stopMySQL();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  mysqlManager.stopMySQL();
});
