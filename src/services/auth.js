// src/services/auth.js
export const authService = {
  needsSetup: () => window.api.auth.needsSetup(),
  createFirstAdmin: (payload) => window.api.auth.createFirstAdmin(payload),
  login: (payload) => window.api.auth.login(payload),
  logout: () => window.api.auth.logout(),
  current: () => window.api.auth.current(),
};
