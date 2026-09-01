const pool = require("../db");

async function applyLateFees() {
  const [ruleRows] = await pool.query(
    "SELECT * FROM late_fee_rules WHERE active=1 LIMIT 1",
  );
  const rule = ruleRows[0];
  const [overdueRows] = await pool.query(
    `SELECT * FROM installment_schedule WHERE due_date < CURDATE() AND status IN ('pending','partial')`,
  );
  for (const row of overdueRows) {
    const daysOverdue = Math.floor(
      (new Date() - new Date(row.due_date)) / (1000 * 60 * 60 * 24),
    );
    let lateFee = Number(row.late_fee) || 0;
    if (rule) {
      if (rule.rule_type === "fixed") lateFee = Number(rule.value);
      else if (rule.rule_type === "percent_per_day")
        lateFee =
          Math.round(row.due_amount * (rule.value / 100) * daysOverdue * 100) /
          100;
      else if (rule.rule_type === "percent_per_week")
        lateFee =
          Math.round(
            row.due_amount *
              (rule.value / 100) *
              Math.floor(daysOverdue / 7) *
              100,
          ) / 100;
    }
    await pool.query(
      'UPDATE installment_schedule SET status="overdue", late_fee=? WHERE id=?',
      [lateFee, row.id],
    );
  }
}

module.exports = { applyLateFees };
