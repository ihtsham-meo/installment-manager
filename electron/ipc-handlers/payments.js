const { ipcMain } = require("electron");
const pool = require("../db");
const { applyLateFees } = require("../utils/lateFees");

function registerPaymentHandlers() {
  ipcMain.handle("payments:listForSale", async (event, saleId) => {
    const [rows] = await pool.query(
      `SELECT p.*, ish.installment_no FROM payments p
       JOIN installment_schedule ish ON p.installment_schedule_id = ish.id
       WHERE p.sale_id = ? AND p.voided = 0 ORDER BY p.payment_date DESC`,
      [saleId],
    );
    return rows;
  });

  ipcMain.handle("payments:refreshOverdue", async () => {
    await applyLateFees();
    return { refreshed: true };
  });

  ipcMain.handle(
    "payments:record",
    async (event, { saleId, amount, payment_method, received_by, notes }) => {
      await applyLateFees();
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        const [rows] = await conn.query(
          `SELECT * FROM installment_schedule WHERE sale_id=? AND status != 'paid' ORDER BY due_date ASC`,
          [saleId],
        );

        let remainingAmount = Number(amount);
        const created = [];

        for (const row of rows) {
          if (remainingAmount <= 0) break;
          const owed =
            Number(row.due_amount) +
            Number(row.late_fee) -
            Number(row.paid_amount);
          if (owed <= 0) continue;
          const applied = Math.min(remainingAmount, owed);
          const newPaid = Number(row.paid_amount) + applied;
          const isPaid =
            newPaid >= Number(row.due_amount) + Number(row.late_fee) - 0.01;

          await conn.query(
            `UPDATE installment_schedule SET paid_amount=?, status=?, paid_date=? WHERE id=?`,
            [
              newPaid,
              isPaid ? "paid" : "partial",
              isPaid ? new Date() : null,
              row.id,
            ],
          );

          const [payResult] = await conn.query(
            `INSERT INTO payments (sale_id, installment_schedule_id, amount, payment_method, received_by, notes) VALUES (?,?,?,?,?,?)`,
            [
              saleId,
              row.id,
              applied,
              payment_method || "cash",
              received_by || null,
              notes || null,
            ],
          );

          created.push({
            id: payResult.insertId,
            installment_schedule_id: row.id,
            installment_no: row.installment_no,
            amount: applied,
          });
          remainingAmount -= applied;
        }

        const [remainingRows] = await conn.query(
          `SELECT COUNT(*) AS cnt FROM installment_schedule WHERE sale_id=? AND status != 'paid'`,
          [saleId],
        );
        if (remainingRows[0].cnt === 0) {
          await conn.query(`UPDATE sales SET status='completed' WHERE id=?`, [
            saleId,
          ]);
        }

        await conn.commit();
        return { payments: created, unallocated: remainingAmount };
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    },
  );

  ipcMain.handle(
    "payments:void",
    async (event, { paymentId, reason, voidedBy }) => {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        const [rows] = await conn.query("SELECT * FROM payments WHERE id=?", [
          paymentId,
        ]);
        const payment = rows[0];
        if (!payment) throw new Error("Payment not found");

        const [schedRows] = await conn.query(
          "SELECT * FROM installment_schedule WHERE id=?",
          [payment.installment_schedule_id],
        );
        const sched = schedRows[0];
        const newPaid = Math.max(
          Number(sched.paid_amount) - Number(payment.amount),
          0,
        );
        const totalDue = Number(sched.due_amount) + Number(sched.late_fee);
        const newStatus =
          newPaid <= 0 ? "pending" : newPaid < totalDue ? "partial" : "paid";

        await conn.query(
          "UPDATE installment_schedule SET paid_amount=?, status=?, paid_date=NULL WHERE id=?",
          [newPaid, newStatus, sched.id],
        );
        await conn.query(
          `UPDATE payments SET voided=1, voided_by=?, voided_at=NOW(), notes=CONCAT(IFNULL(notes,''), ' [VOID: ', ?, ']') WHERE id=?`,
          [voidedBy || null, reason, paymentId],
        );
        await conn.query(
          `UPDATE sales SET status='active' WHERE id=? AND status='completed'`,
          [payment.sale_id],
        );

        await conn.commit();
        return { id: paymentId, voided: true };
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    },
  );
}

module.exports = registerPaymentHandlers;
