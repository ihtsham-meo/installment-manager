const { spawn } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const pool = require("./db");
const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} = require("./mysql-manager");

const MYSQL_BIN_DIR = path.join(
  __dirname,
  "resources",
  "mysql-portable",
  "bin",
);
const MYSQLDUMP_PATH = path.join(MYSQL_BIN_DIR, "mysqldump.exe");
const MYSQL_CLI_PATH = path.join(MYSQL_BIN_DIR, "mysql.exe");
const AUTO_BACKUP_DIR = path.join(__dirname, "backups", "auto");
const AUTO_BACKUP_RETENTION = 30;

function runDump() {
  return new Promise((resolve, reject) => {
    const args = [
      `--host=${DB_HOST}`,
      `--port=${DB_PORT}`,
      `--user=${DB_USER}`,
    ];
    if (DB_PASSWORD) args.push(`--password=${DB_PASSWORD}`);
    args.push(DB_NAME);

    const proc = spawn(MYSQLDUMP_PATH, args);
    let output = "";
    let errOutput = "";
    proc.stdout.on("data", (d) => (output += d.toString()));
    proc.stderr.on("data", (d) => (errOutput += d.toString()));
    proc.on("exit", (code) =>
      code === 0
        ? resolve(output)
        : reject(new Error(`mysqldump exited ${code}: ${errOutput}`)),
    );
  });
}

function encrypt(text, passphrase) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(passphrase, salt, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([salt, iv, cipher.update(text, "utf8"), cipher.final()]);
}

function decrypt(buffer, passphrase) {
  const salt = buffer.slice(0, 16);
  const iv = buffer.slice(16, 32);
  const ciphertext = buffer.slice(32);
  const key = crypto.scryptSync(passphrase, salt, 32);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

async function createBackup(destPath, passphrase, backupType = "local") {
  const sql = await runDump();
  const encrypted = encrypt(sql, passphrase);
  fs.writeFileSync(destPath, encrypted);
  await pool.query(
    `INSERT INTO backups (backup_path, backup_type, encrypted, size_bytes, status) VALUES (?, ?, 1, ?, 'success')`,
    [destPath, backupType, encrypted.length],
  );
  return { path: destPath, size: encrypted.length };
}

async function restoreBackup(sourcePath, passphrase) {
  const sql = decrypt(fs.readFileSync(sourcePath), passphrase);

  if (!fs.existsSync(AUTO_BACKUP_DIR))
    fs.mkdirSync(AUTO_BACKUP_DIR, { recursive: true });
  const safetyPath = path.join(
    AUTO_BACKUP_DIR,
    `pre-restore-${Date.now()}.backup`,
  );
  await createBackup(safetyPath, passphrase, "local");

  const tempSqlPath = path.join(__dirname, "temp-restore.sql");
  fs.writeFileSync(tempSqlPath, sql, "utf8");

  await new Promise((resolve, reject) => {
    const proc = spawn(MYSQL_CLI_PATH, [
      `--host=${DB_HOST}`,
      `--port=${DB_PORT}`,
      `--user=${DB_USER}`,
      "-e",
      `DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME};`,
    ]);
    proc.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error("Failed to reset database before restore")),
    );
  });

  await new Promise((resolve, reject) => {
    const proc = spawn(
      MYSQL_CLI_PATH,
      [`--host=${DB_HOST}`, `--port=${DB_PORT}`, `--user=${DB_USER}`, DB_NAME],
      { stdio: ["pipe", "inherit", "inherit"] },
    );
    fs.createReadStream(tempSqlPath).pipe(proc.stdin);
    proc.on("exit", (code) => {
      fs.unlinkSync(tempSqlPath);
      code === 0 ? resolve() : reject(new Error("mysql import failed"));
    });
  });

  return { restored: true, safetyBackup: safetyPath };
}

async function runScheduledBackupIfDue(passphrase) {
  if (!fs.existsSync(AUTO_BACKUP_DIR))
    fs.mkdirSync(AUTO_BACKUP_DIR, { recursive: true });
  const files = fs
    .readdirSync(AUTO_BACKUP_DIR)
    .filter((f) => f.startsWith("auto-"))
    .sort();
  const lastTime = files.length
    ? fs.statSync(path.join(AUTO_BACKUP_DIR, files[files.length - 1])).mtimeMs
    : 0;
  if (Date.now() - lastTime < 24 * 60 * 60 * 1000) return { skipped: true };

  const destPath = path.join(AUTO_BACKUP_DIR, `auto-${Date.now()}.backup`);
  await createBackup(destPath, passphrase, "local");

  const all = fs
    .readdirSync(AUTO_BACKUP_DIR)
    .filter((f) => f.startsWith("auto-"))
    .sort();
  while (all.length > AUTO_BACKUP_RETENTION)
    fs.unlinkSync(path.join(AUTO_BACKUP_DIR, all.shift()));

  return { created: destPath };
}

module.exports = { createBackup, restoreBackup, runScheduledBackupIfDue };
