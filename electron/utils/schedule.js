function generateSchedule({ totalAmount, downPayment, installmentCount, startDate, frequency }) {
  const remaining = totalAmount - downPayment;
  const baseAmount = Math.floor((remaining / installmentCount) * 100) / 100;
  const schedule = [];

  let runningTotal = 0;
  const start = new Date(startDate);

  for (let i = 1; i <= installmentCount; i++) {
    const dueDate = new Date(start);
    if (frequency === 'weekly') {
      dueDate.setDate(dueDate.getDate() + 7 * i);
    } else {
      dueDate.setMonth(dueDate.getMonth() + i);
    }

    // Last installment absorbs any rounding difference
    let amount = baseAmount;
    if (i === installmentCount) {
      amount = Math.round((remaining - runningTotal) * 100) / 100;
    }
    runningTotal += amount;

    schedule.push({
      installment_no: i,
      due_date: dueDate.toISOString().slice(0, 10),
      due_amount: amount,
    });
  }

  return schedule;
}

module.exports = { generateSchedule };