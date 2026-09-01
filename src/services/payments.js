// src/services/payments.js
export const paymentService = {
  listForSale: (saleId) => window.api.payments.listForSale(saleId),
  record: (payload) => window.api.payments.record(payload),
  void: (payload) => window.api.payments.void(payload),
  refreshOverdue: () => window.api.payments.refreshOverdue(),
};
