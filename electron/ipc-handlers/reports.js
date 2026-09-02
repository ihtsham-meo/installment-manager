const { ipcMain, dialog } = require("electron");
const fs = require("fs");
const pool = require("../db");

function registerReportHandlers() {
  ipcMain.handle("reports:dashboard", async () => {
    const [dueRows] = await pool.query(
      `SELECT COALESCE(SUM(due_amount + late_fee - paid_amount),0) AS total
       FROM installment_schedule WHERE due_date = CURDATE() AND status != 'paid'`,
    );
    const [collectedRows] = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE DATE(payment_date) = CURDATE() AND voided = 0`,
    );
    const [outstandingRows] = await pool.query(
      `SELECT COALESCE(SUM(due_amount + late_fee - paid_amount),0) AS total
       FROM installment_schedule WHERE status IN ('pending','partial','overdue')`,
    );
    const [activeRows] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM sales WHERE status='active'`,
    );
    const [overdueRows] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM installment_schedule WHERE status='overdue'`,
    );

    return {
      todayDue: dueRows[0].total,
      todayCollected: collectedRows[0].total,
      totalOutstanding: outstandingRows[0].total,
      activePlans: activeRows[0].cnt,
      overdueCount: overdueRows[0].cnt,
    };
  });

  ipcMain.handle("reports:collections", async (event, { from, to }) => {
    const [rows] = await pool.query(
      `SELECT DATE(payment_date) AS date, SUM(amount) AS total
       FROM payments WHERE voided = 0 AND DATE(payment_date) BETWEEN ? AND ?
       GROUP BY DATE(payment_date) ORDER BY date ASC`,
      [from, to],
    );
    return rows;
  });

  ipcMain.handle("reports:defaulters", async () => {
    const [rows] = await pool.query(`
      SELECT c.id AS customer_id, c.full_name, c.phone,
        COUNT(ish.id) AS overdue_installments,
        SUM(ish.due_amount + ish.late_fee - ish.paid_amount) AS overdue_amount,
        MAX(DATEDIFF(CURDATE(), ish.due_date)) AS max_days_overdue
      FROM installment_schedule ish
      JOIN sales s ON ish.sale_id = s.id
      JOIN customers c ON s.customer_id = c.id
      WHERE ish.status = 'overdue'
      GROUP BY c.id
      ORDER BY overdue_amount DESC
    `);
    return rows;
  });

  ipcMain.handle("reports:productSales", async () => {
    const [rows] = await pool.query(`
      SELECT p.id, p.name, p.company, SUM(si.quantity) AS units_sold, SUM(si.subtotal) AS revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.voided = 0
      GROUP BY p.id
      ORDER BY revenue DESC
    `);
    return rows;
  });

  ipcMain.handle("reports:profit", async () => {
    const [rows] = await pool.query(`
      SELECT p.id, p.name,
        SUM(si.quantity) AS units_sold,
        SUM(si.subtotal) AS revenue,
        SUM(si.quantity * p.cost_price) AS cost,
        SUM(si.subtotal - (si.quantity * p.cost_price)) AS profit
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.voided = 0
      GROUP BY p.id
      ORDER BY profit DESC
    `);
    return rows;
  });

  ipcMain.handle("reports:exportCsv", async (event, { filename, rows }) => {
    if (!rows || rows.length === 0) return { canceled: true };
    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(",")];
    for (const row of rows) {
      csvLines.push(
        headers
          .map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`)
          .join(","),
      );
    }
    const result = await dialog.showSaveDialog({
      defaultPath: filename,
      filters: [{ name: "CSV", extensions: ["csv"] }],
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    fs.writeFileSync(result.filePath, csvLines.join("\n"), "utf8");
    return { canceled: false, path: result.filePath };
  });
}

module.exports = registerReportHandlers;
