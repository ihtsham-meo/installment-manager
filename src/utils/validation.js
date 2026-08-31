export function sanitizeName(raw) {
  return raw.replace(/[^A-Za-z\s.]/g, '');
}
export function sanitizePhone(raw) {
  return raw.replace(/[^\d+]/g, '');
}
export function formatCnic(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 13);
  return [digits.slice(0, 5), digits.slice(5, 12), digits.slice(12, 13)].filter(Boolean).join('-');
}