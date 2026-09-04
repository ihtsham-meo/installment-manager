function allocatePayment(scheduleRows, amount) {
  let remaining = Number(amount);
  const allocations = [];

  for (const row of scheduleRows) {
    if (remaining <= 0) break;
    const owed =
      Number(row.due_amount) + Number(row.late_fee) - Number(row.paid_amount);
    if (owed <= 0) continue;

    const applied = Math.min(remaining, owed);
    const newPaid = Number(row.paid_amount) + applied;
    const isPaid =
      newPaid >= Number(row.due_amount) + Number(row.late_fee) - 0.01;

    allocations.push({ scheduleId: row.id, applied, newPaid, isPaid });
    remaining -= applied;
  }

  return { allocations, unallocated: remaining };
}

module.exports = { allocatePayment };
