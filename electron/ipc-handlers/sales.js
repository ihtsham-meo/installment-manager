const { ipcMain } = require("electron");
const pool = require("../db");
const { generateSchedule } = require("../utils/schedule");

function registerSalesHandlers() {
  ipcMain.handle("sales:list", async () => {
    const [rows] = await pool.query(
      `SELECT s.*, c.full_name AS customer_name
       FROM sales s JOIN customers c ON s.customer_id = c.id
       WHERE s.voided = 0 ORDER BY s.sale_date DESC`,
    );
    return rows;
  });

  ipcMain.handle("sales:getSchedule", async (event, saleId) => {
    const [rows] = await pool.query(
      "SELECT * FROM installment_schedule WHERE sale_id = ? ORDER BY installment_no",
      [saleId],
    );
    return rows;
  });

  ipcMain.handle(
    "sales:updateScheduleRow",
    async (event, { scheduleId, due_date, due_amount }) => {
      await pool.query(
        "UPDATE installment_schedule SET due_date = ?, due_amount = ? WHERE id = ?",
        [due_date, due_amount, scheduleId],
      );
      return { id: scheduleId, due_date, due_amount };
    },
  );

  ipcMain.handle("sales:create", async (event, saleData) => {
    const {
      customer_id,
      items,
      down_payment,
      installment_count,
      plan_start_date,
      frequency,
      created_by,
    } = saleData;

    const total_amount = items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0,
    );
    const installment_amount =
      Math.round(((total_amount - down_payment) / installment_count) * 100) /
      100;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (const item of items) {
        const [rows] = await conn.query(
          "SELECT stock_quantity, name FROM products WHERE id = ? FOR UPDATE",
          [item.product_id],
        );
        const product = rows[0];
        if (!product)
          throw new Error(`Product ID ${item.product_id} not found`);
        if (product.stock_quantity < item.quantity) {
          throw new Error(
            `Not enough stock for "${product.name}". Available: ${product.stock_quantity}, requested: ${item.quantity}`,
          );
        }
      }

      const [saleResult] = await conn.query(
        `INSERT INTO sales (customer_id, total_amount, down_payment, installment_count, installment_amount, plan_start_date, frequency, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customer_id,
          total_amount,
          down_payment,
          installment_count,
          installment_amount,
          plan_start_date,
          frequency || "monthly",
          created_by || null,
        ],
      );
      const saleId = saleResult.insertId;

      for (const item of items) {
        await conn.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)`,
          [
            saleId,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.quantity * item.unit_price,
          ],
        );
        await conn.query(
          `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`,
          [item.quantity, item.product_id],
        );
      }

      const schedule = generateSchedule({
        totalAmount: total_amount,
        downPayment: down_payment,
        installmentCount: installment_count,
        startDate: plan_start_date,
        frequency: frequency || "monthly",
      });

      for (const row of schedule) {
        await conn.query(
          `INSERT INTO installment_schedule (sale_id, installment_no, due_date, due_amount) VALUES (?, ?, ?, ?)`,
          [saleId, row.installment_no, row.due_date, row.due_amount],
        );
      }

      await conn.commit();
      return { id: saleId, total_amount, schedule };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  });

  ipcMain.handle("sales:void", async (event, { saleId, reason, voidedBy }) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [items] = await conn.query(
        "SELECT * FROM sale_items WHERE sale_id = ?",
        [saleId],
      );
      for (const item of items) {
        await conn.query(
          "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?",
          [item.quantity, item.product_id],
        );
      }

      await conn.query(
        `UPDATE sales SET voided = 1, voided_by = ?, voided_at = NOW(), void_reason = ?, status = 'cancelled' WHERE id = ?`,
        [voidedBy || null, reason, saleId],
      );

      await conn.commit();
      return { id: saleId, voided: true };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  });

  ipcMain.handle("sales:summary", async () => {
    const [rows] = await pool.query(`
    SELECT s.id, c.full_name AS customer_name, s.total_amount, s.down_payment, s.status,
      COALESCE(SUM(ish.paid_amount),0) AS total_paid,
      (s.total_amount - s.down_payment - COALESCE(SUM(ish.paid_amount),0)) AS remaining
    FROM sales s
    JOIN customers c ON s.customer_id = c.id
    LEFT JOIN installment_schedule ish ON ish.sale_id = s.id
    WHERE s.voided = 0
    GROUP BY s.id
    ORDER BY s.sale_date DESC
  `);
    return rows;
  });
}

module.exports = registerSalesHandlers;
