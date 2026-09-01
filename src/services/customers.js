export const customerService = {
  list: () => window.api.customers.list(),
  getGuarantors: (customerId) => window.api.customers.getGuarantors(customerId),
  checkCnic: (cnic) => window.api.customers.checkCnic(cnic),
  selectFile: () => window.api.customers.selectFile(),
  add: (payload) => window.api.customers.add(payload),
  update: (payload) => window.api.customers.update(payload),
  delete: (id) => window.api.customers.delete(id),
};