export const saleService = {
  list: () => window.api.sales.list(),
  getSchedule: (saleId) => window.api.sales.getSchedule(saleId),
  create: (saleData) => window.api.sales.create(saleData),
  void: (payload) => window.api.sales.void(payload),
};
