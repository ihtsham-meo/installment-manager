const { generateSchedule } = require("../../electron/utils/schedule");

describe("generateSchedule", () => {
  test("monthly installments always due on the 10th", () => {
    const schedule = generateSchedule({
      totalAmount: 45000,
      downPayment: 9000,
      installmentCount: 6,
      startDate: "2026-08-31",
      frequency: "monthly",
    });
    expect(schedule).toHaveLength(6);
    schedule.forEach((row) => expect(row.due_date.endsWith("-10")).toBe(true));
    expect(schedule[0].due_date).toBe("2026-09-10");
    expect(schedule[5].due_date).toBe("2027-02-10");
  });

  test("last installment absorbs rounding difference", () => {
    const schedule = generateSchedule({
      totalAmount: 1000,
      downPayment: 0,
      installmentCount: 3,
      startDate: "2026-01-01",
      frequency: "monthly",
    });
    const total = schedule.reduce((sum, r) => sum + r.due_amount, 0);
    expect(total).toBeCloseTo(1000, 2);
  });

  test("weekly frequency uses 7-day intervals", () => {
    const schedule = generateSchedule({
      totalAmount: 700,
      downPayment: 0,
      installmentCount: 2,
      startDate: "2026-01-01",
      frequency: "weekly",
    });
    expect(schedule[0].due_date).toBe("2026-01-08");
    expect(schedule[1].due_date).toBe("2026-01-15");
  });
});
