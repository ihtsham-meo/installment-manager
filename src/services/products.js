export const productService = {
  list: () => window.api.products.list(),
  add: (product) => window.api.products.add(product),
  update: (id, product) => window.api.products.update(id, product),
  delete: (id) => window.api.products.delete(id),
};