const { ipcMain } = require("electron");
const pool = require("../db");
const { applyLateFees } = require("../utils/lateFees");
const { getCurrentUser, requireRole } = require("../session");
const { logAudit } = require("../audit");
const { allocatePayment } = require("../utils/paymentAllocation");

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
    async (event, { saleId, amount, payment_method, notes }) => {
      await applyLateFees();
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        const [rows] = await conn.query(
          `SELECT * FROM installment_schedule WHERE sale_id=? AND status != 'paid' ORDER BY due_date ASC`,
          [saleId],
        );

        const { allocations, unallocated } = allocatePayment(rows, amount);
        const created = [];

        for (const alloc of allocations) {
          const row = rows.find((r) => r.id === alloc.scheduleId);

          await conn.query(
            `UPDATE installment_schedule SET paid_amount=?, status=?, paid_date=? WHERE id=?`,
            [
              alloc.newPaid,
              alloc.isPaid ? "paid" : "partial",
              alloc.isPaid ? new Date() : null,
              alloc.scheduleId,
            ],
          );

          const [payResult] = await conn.query(
            `INSERT INTO payments (sale_id, installment_schedule_id, amount, payment_method, received_by, notes) VALUES (?,?,?,?,?,?)`,
            [
              saleId,
              alloc.scheduleId,
              alloc.applied,
              payment_method || "cash",
              getCurrentUser()?.id || null,
              notes || null,
            ],
          );

          created.push({
            id: payResult.insertId,
            installment_schedule_id: alloc.scheduleId,
            installment_no: row.installment_no,
            amount: alloc.applied,
          });
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

        await logAudit("record", "payments", saleId, null, { amount });
        await conn.commit();
        return { payments: created, unallocated };
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
      requireRole("admin", "manager");
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
          [getCurrentUser()?.id || null, reason, paymentId],
        );
        await conn.query(
          `UPDATE sales SET status='active' WHERE id=? AND status='completed'`,
          [payment.sale_id],
        );

        await logAudit("void", "payments", paymentId, null, { reason });
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
