const { app, BrowserWindow } = require("electron");
const path = require("path");
const mysqlManager = require("./mysql-manager");
const registerProductHandlers = require("./ipc-handlers/products");
const registerCustomerHandlers = require("./ipc-handlers/customers");
const registerSalesHandlers = require("./ipc-handlers/sales");
const registerPaymentHandlers = require("./ipc-handlers/payments");
const { applyLateFees } = require("./utils/lateFees");
const registerReportHandlers = require("./ipc-handlers/reports");
// inside app.whenReady(), alongside the others:

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
  createWindow();
});

app.on("window-all-closed", () => {
  mysqlManager.stopMySQL();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  mysqlManager.stopMySQL();
});
