const { calculateLateFee } = require("../../electron/utils/lateFees");

describe("calculateLateFee", () => {
  test("returns 0 when no rule exists", () => {
    expect(calculateLateFee(1000, 5, null)).toBe(0);
  });
  test("fixed rule returns flat amount regardless of days", () => {
    expect(calculateLateFee(1000, 20, { rule_type: "fixed", value: 200 })).toBe(
      200,
    );
  });
  test("percent_per_day compounds by days overdue", () => {
    expect(
      calculateLateFee(1000, 5, { rule_type: "percent_per_day", value: 1 }),
    ).toBe(50);
  });
  test("percent_per_week only counts full weeks", () => {
    expect(
      calculateLateFee(1000, 10, { rule_type: "percent_per_week", value: 2 }),
    ).toBe(20);
    expect(
      calculateLateFee(1000, 6, { rule_type: "percent_per_week", value: 2 }),
    ).toBe(0);
  });
});
