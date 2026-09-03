// src/services/users.js
export const userService = {
  list: () => window.api.users.list(),
  add: (payload) => window.api.users.add(payload),
  update: (payload) => window.api.users.update(payload),
  resetPassword: (payload) => window.api.users.resetPassword(payload),
  changeOwnPassword: (payload) => window.api.users.changeOwnPassword(payload),
};
