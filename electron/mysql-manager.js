const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2/promise");

const MYSQL_DIR = path.join(__dirname, "resources", "mysql-portable");
const MYSQLD_PATH = path.join(MYSQL_DIR, "bin", "mysqld.exe");
const DATA_DIR = path.join(__dirname, "mysql-data");
const CONFIG_PATH = path.join(MYSQL_DIR, "my.ini");
const DB_HOST = "127.0.0.1";
const DB_PORT = 3307;
const DB_USER = "root";
const DB_PASSWORD = "";
const DB_NAME = "installment_manager";

let mysqldProcess = null;

function isInitialized() {
  return fs.existsSync(DATA_DIR) && fs.readdirSync(DATA_DIR).length > 0;
}

function initializeDataDir() {
  return new Promise((resolve, reject) => {
    const proc = spawn(MYSQLD_PATH, [
      "--initialize-insecure",
      `--datadir=${DATA_DIR}`,
      "--console",
    ]);
    proc.stderr.on("data", (d) => console.log(`[mysql-init] ${d}`));
    proc.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`init exited ${code}`)),
    );
  });
}

function startMySQL() {
  return new Promise((resolve, reject) => {
    mysqldProcess = spawn(MYSQLD_PATH, [
      `--defaults-file=${CONFIG_PATH}`,
      `--datadir=${DATA_DIR}`,
    ]);

    mysqldProcess.stderr.on("data", (data) => {
      const msg = data.toString();
      console.log(`[mysqld] ${msg}`);
      if (msg.includes("ready for connections")) resolve();
    });
    mysqldProcess.on("error", reject);
    mysqldProcess.on("exit", (code) => {
      console.log(`mysqld exited with code ${code}`);
      mysqldProcess = null;
    });
    setTimeout(resolve, 5000); // fallback in case the log line format differs
  });
}

function stopMySQL() {
  if (mysqldProcess) {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', mysqldProcess.pid, '/f', '/t']);
    } else {
      mysqldProcess.kill();
    }
    mysqldProcess = null;
  }
}

async function waitForConnection(retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
      });
      await conn.end();
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error("Could not connect to local MySQL server");
}

async function ensureDatabaseAndSchema() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
  await conn.end();

  const dbConn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true,
  });
  const schemaSQL = fs.readFileSync(
    path.join(__dirname, "..", "db", "schema.sql"),
    "utf8",
  );
  await dbConn.query(schemaSQL);
  await dbConn.end();
}

async function initAndStart() {
  if (!isInitialized()) {
    console.log("Initializing MySQL data directory...");
    await initializeDataDir();
  }
  console.log("Starting MySQL server...");
  await startMySQL();
  await waitForConnection();
  await ensureDatabaseAndSchema();
  console.log("MySQL ready and schema applied.");
}

module.exports = {
  initAndStart,
  stopMySQL,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
};
