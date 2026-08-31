function isValidName(name) {
  return /^[A-Za-z\s.]+$/.test(name || '');
}
function isValidPhone(phone) {
  return /^\+?\d{7,15}$/.test(phone || '');
}
function isValidCnic(cnic) {
  return /^\d{5}-\d{7}-\d{1}$/.test(cnic || '');
}
module.exports = { isValidName, isValidPhone, isValidCnic };