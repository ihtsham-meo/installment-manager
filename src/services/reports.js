export const reportService = {
  dashboard: () => window.api.reports.dashboard(),
  collections: (range) => window.api.reports.collections(range),
  defaulters: () => window.api.reports.defaulters(),
  productSales: () => window.api.reports.productSales(),
  profit: () => window.api.reports.profit(),
  exportCsv: (payload) => window.api.reports.exportCsv(payload),
};
