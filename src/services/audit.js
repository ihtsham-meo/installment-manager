// src/services/audit.js
export const auditService = {
  list: (payload) => window.api.audit.list(payload),
};
