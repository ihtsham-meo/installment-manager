let currentUser = null;

function setCurrentUser(user) {
  currentUser = user;
}
function getCurrentUser() {
  return currentUser;
}
function requireRole(...allowedRoles) {
  if (!currentUser) throw new Error("Not logged in");
  if (!allowedRoles.includes(currentUser.role))
    throw new Error("You do not have permission to do this");
}

module.exports = { setCurrentUser, getCurrentUser, requireRole };
