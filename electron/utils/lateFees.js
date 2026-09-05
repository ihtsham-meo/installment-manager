const pool = require("../db");

function calculateLateFee(dueAmount, daysOverdue, rule) {
  if (!rule) return 0;
  if (rule.rule_type === "fixed") return Number(rule.value);
  if (rule.rule_type === "percent_per_day")
    return Math.round(dueAmount * (rule.value / 100) * daysOverdue * 100) / 100;
  if (rule.rule_type === "percent_per_week")
    return (
      Math.round(
        dueAmount * (rule.value / 100) * Math.floor(daysOverdue / 7) * 100,
      ) / 100
    );
  return 0;
}

async function applyLateFees() {
  const [ruleRows] = await pool.query(
    "SELECT * FROM late_fee_rules WHERE active=1 LIMIT 1",
  );
  const rule = ruleRows[0] || null;
  const [overdueRows] = await pool.query(
    `SELECT ish.*, DATEDIFF(CURDATE(), ish.due_date) AS days_overdue
     FROM installment_schedule ish
     JOIN sales s ON s.id = ish.sale_id
     WHERE ish.due_date < CURDATE() AND ish.status != 'paid'
       AND s.voided = 0 AND s.status != 'cancelled'`,
  );
  for (const row of overdueRows) {
    const daysOverdue = Number(row.days_overdue);
    const lateFee = calculateLateFee(row.due_amount, daysOverdue, rule);
    await pool.query(
      'UPDATE installment_schedule SET status="overdue", late_fee=? WHERE id=?',
      [lateFee, row.id],
    );
  }
}

module.exports = { applyLateFees, calculateLateFee };
