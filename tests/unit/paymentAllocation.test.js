const { allocatePayment } = require("../../electron/utils/paymentAllocation");

const scheduleRows = [
  { id: 1, due_amount: 1000, late_fee: 0, paid_amount: 0 },
  { id: 2, due_amount: 1000, late_fee: 0, paid_amount: 0 },
];

describe("allocatePayment", () => {
  test("exact payment fully pays one installment", () => {
    const { allocations, unallocated } = allocatePayment(scheduleRows, 1000);
    expect(allocations).toHaveLength(1);
    expect(allocations[0].isPaid).toBe(true);
    expect(unallocated).toBe(0);
  });

  test("overpayment rolls into next installment", () => {
    const { allocations, unallocated } = allocatePayment(scheduleRows, 1500);
    expect(allocations).toHaveLength(2);
    expect(allocations[0].isPaid).toBe(true);
    expect(allocations[1].isPaid).toBe(false);
    expect(allocations[1].applied).toBe(500);
    expect(unallocated).toBe(0);
  });

  test("partial payment marks installment partial", () => {
    const { allocations } = allocatePayment(scheduleRows, 400);
    expect(allocations[0].isPaid).toBe(false);
    expect(allocations[0].newPaid).toBe(400);
  });

  test("excess beyond all installments is left unallocated", () => {
    const { unallocated } = allocatePayment(scheduleRows, 5000);
    expect(unallocated).toBe(3000);
  });
});
