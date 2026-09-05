const { ipcMain, dialog } = require("electron");
const fs = require("fs");
const pool = require("../db");
const { applyLateFees } = require("../utils/lateFees");

function registerReportHandlers() {
  ipcMain.handle("reports:dashboard", async () => {
    await applyLateFees();

    const [dueRows] = await pool.query(
      `SELECT COALESCE(SUM(GREATEST(ish.due_amount + ish.late_fee - ish.paid_amount, 0)), 0) AS total
       FROM installment_schedule ish
       JOIN sales s ON s.id = ish.sale_id
       WHERE ish.due_date = CURDATE() AND ish.status != 'paid'
         AND s.voided = 0 AND s.status != 'cancelled'`,
    );
    const [collectedRows] = await pool.query(
      `SELECT COALESCE(SUM(p.amount), 0) AS total
       FROM payments p
       JOIN sales s ON s.id = p.sale_id
       WHERE DATE(p.payment_date) = CURDATE() AND p.voided = 0
         AND s.voided = 0 AND s.status != 'cancelled'`,
    );
    const [outstandingRows] = await pool.query(
      `SELECT COALESCE(SUM(GREATEST(ish.due_amount + ish.late_fee - ish.paid_amount, 0)), 0) AS total
       FROM installment_schedule ish
       JOIN sales s ON s.id = ish.sale_id
       WHERE ish.status != 'paid' AND s.voided = 0 AND s.status != 'cancelled'`,
    );
    const [activeRows] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM sales WHERE status = 'active' AND voided = 0`,
    );
    const [overdueRows] = await pool.query(
      `SELECT COUNT(*) AS cnt,
         COALESCE(SUM(GREATEST(ish.due_amount + ish.late_fee - ish.paid_amount, 0)), 0) AS total
       FROM installment_schedule ish
       JOIN sales s ON s.id = ish.sale_id
       WHERE ish.due_date < CURDATE() AND ish.status != 'paid'
         AND s.voided = 0 AND s.status != 'cancelled'`,
    );
    const [upcomingRows] = await pool.query(
      `SELECT COALESCE(SUM(GREATEST(ish.due_amount + ish.late_fee - ish.paid_amount, 0)), 0) AS total
       FROM installment_schedule ish
       JOIN sales s ON s.id = ish.sale_id
       WHERE ish.due_date > CURDATE()
         AND ish.due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
         AND ish.status != 'paid' AND s.voided = 0 AND s.status != 'cancelled'`,
    );
    const [collectionTrend] = await pool.query(
      `SELECT DATE_FORMAT(p.payment_date, '%Y-%m-%d') AS date, SUM(p.amount) AS total
       FROM payments p
       JOIN sales s ON s.id = p.sale_id
       WHERE p.voided = 0 AND s.voided = 0 AND s.status != 'cancelled'
         AND p.payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
         AND p.payment_date < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
       GROUP BY DATE_FORMAT(p.payment_date, '%Y-%m-%d')
       ORDER BY date ASC`,
    );
    const [recentPayments] = await pool.query(
      `SELECT p.id, c.full_name AS customer_name, ish.installment_no, p.amount,
         p.payment_method, DATE_FORMAT(p.payment_date, '%Y-%m-%d %H:%i') AS payment_date
       FROM payments p
       JOIN sales s ON s.id = p.sale_id
       JOIN customers c ON c.id = s.customer_id
       JOIN installment_schedule ish ON ish.id = p.installment_schedule_id
       WHERE p.voided = 0 AND s.voided = 0 AND s.status != 'cancelled'
       ORDER BY p.payment_date DESC
       LIMIT 5`,
    );
    const [overdueItems] = await pool.query(
      `SELECT ish.id, c.full_name AS customer_name, ish.installment_no,
         DATE_FORMAT(ish.due_date, '%Y-%m-%d') AS due_date,
         DATEDIFF(CURDATE(), ish.due_date) AS days_overdue,
         GREATEST(ish.due_amount + ish.late_fee - ish.paid_amount, 0) AS outstanding
       FROM installment_schedule ish
       JOIN sales s ON s.id = ish.sale_id
       JOIN customers c ON c.id = s.customer_id
       WHERE ish.due_date < CURDATE() AND ish.status != 'paid'
         AND s.voided = 0 AND s.status != 'cancelled'
       ORDER BY days_overdue DESC, outstanding DESC
       LIMIT 5`,
    );

    return {
      todayDue: dueRows[0].total,
      todayCollected: collectedRows[0].total,
      totalOutstanding: outstandingRows[0].total,
      activePlans: activeRows[0].cnt,
      overdueCount: overdueRows[0].cnt,
      overdueAmount: overdueRows[0].total,
      dueNext7Days: upcomingRows[0].total,
      collectionTrend,
      recentPayments,
      overdueItems,
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
