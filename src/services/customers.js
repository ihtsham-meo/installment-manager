export const customerService = {
  list: () => window.api.customers.list(),
  checkCnic: (cnic) => window.api.customers.checkCnic(cnic),
  selectFile: () => window.api.customers.selectFile(),
  add: (customer) => window.api.customers.add(customer),
  update: (id, customer) => window.api.customers.update(id, customer),
  delete: (id) => window.api.customers.delete(id),
};
